"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const results_db_1 = require("./results-db");
const config_params_1 = require("./config-params");
const editor_control_1 = require("./editor-control");
const linter_support_1 = require("./linter-support");
const tooltip_registry_1 = require("./tooltip-registry");
const check_results_provider_1 = require("./check-results-provider");
const status_bar_1 = require("./status-bar");
const prettify_1 = require("./prettify");
const editor_mark_control_1 = require("./editor-mark-control");
class PluginManager {
    constructor(state, outputPanel) {
        this.outputPanel = outputPanel;
        this.disposables = new atom_1.CompositeDisposable();
        this.emitter = new atom_1.Emitter();
        this.controllers = new Map();
        this.onWillSaveBuffer = (callback) => this.emitter.on('will-save-buffer', callback);
        this.onDidSaveBuffer = (callback) => this.emitter.on('did-save-buffer', callback);
        this.onDidStopChanging = (callback) => this.emitter.on('did-stop-changing', callback);
        this.disposables.add(this.emitter);
        this.resultsDB = new results_db_1.ResultsDB();
        this.outputPanel.connectResults(this.resultsDB);
        this.tooltipRegistry = new tooltip_registry_1.TooltipRegistry(this);
        this.configParamManager = new config_params_1.ConfigParamManager(this.outputPanel, state.configParams);
        this.disposables.add(this.addEditorController(editor_control_1.EditorControl), this.addEditorController(prettify_1.PrettifyEditorController), this.addEditorController(editor_mark_control_1.EditorMarkControl));
        if (atom.config.get('ide-haskell.messageDisplayFrontend') === 'builtin') {
            this.checkResultsProvider = new check_results_provider_1.CheckResultsProvider(this);
        }
        this.subscribeEditorController();
    }
    deactivate() {
        this.resultsDB.destroy();
        this.disposables.dispose();
        if (this.checkResultsProvider)
            this.checkResultsProvider.destroy();
        this.outputPanel.reallyDestroy();
        this.configParamManager.destroy();
        this.removeStatusBar();
        if (this.linterSupport) {
            this.linterSupport.destroy();
            this.linterSupport = undefined;
        }
    }
    serialize() {
        return {
            configParams: this.configParamManager.serialize(),
        };
    }
    willSaveBuffer(buffer) {
        return this.emitter.emit('will-save-buffer', buffer);
    }
    didSaveBuffer(buffer) {
        return this.emitter.emit('did-save-buffer', buffer);
    }
    didStopChanging(buffer) {
        return this.emitter.emit('did-stop-changing', buffer);
    }
    togglePanel() {
        atom.workspace.toggle(this.outputPanel);
    }
    controller(editor) {
        return this.controllerType(editor_control_1.EditorControl, editor);
    }
    controllerType(factory, editor) {
        const ecmap = this.controllers.get(factory);
        const rec = ecmap ? ecmap.get(editor) : undefined;
        return rec ? rec.controller : undefined;
    }
    setLinter(linter) {
        if (atom.config.get('ide-haskell.messageDisplayFrontend') !== 'linter') {
            return;
        }
        this.linterSupport = new linter_support_1.LinterSupport(linter, this.resultsDB);
    }
    nextError() {
        if (atom.config.get('ide-haskell.messageDisplayFrontend') !== 'builtin') {
            return;
        }
        this.outputPanel.showNextError();
    }
    prevError() {
        if (atom.config.get('ide-haskell.messageDisplayFrontend') !== 'builtin') {
            return;
        }
        this.outputPanel.showPrevError();
    }
    backendStatus(pluginName, st) {
        this.outputPanel.backendStatus(pluginName, st);
        if (this.statusBarView) {
            this.statusBarView.backendStatus(pluginName, st);
        }
    }
    addEditorController(factory) {
        if (this.controllers.has(factory)) {
            throw new Error(`Duplicate controller factory ${factory.toString()}`);
        }
        const map = new WeakMap();
        this.controllers.set(factory, map);
        return new atom_1.Disposable(() => {
            this.controllers.delete(factory);
            for (const te of atom.workspace.getTextEditors()) {
                const rec = map.get(te);
                if (rec)
                    rec.disposable.dispose();
            }
        });
    }
    setStatusBar(sb) {
        this.statusBarView = new status_bar_1.StatusBarView(this.outputPanel);
        this.statusBarTile = sb.addRightTile({
            item: this.statusBarView.element,
            priority: 100,
        });
    }
    removeStatusBar() {
        if (this.statusBarTile) {
            this.statusBarTile.destroy();
            this.statusBarTile = undefined;
        }
        if (this.statusBarView) {
            this.statusBarView.destroy();
            this.statusBarView = undefined;
        }
    }
    controllerOnGrammar(editor, grammar) {
        for (const [factory, map] of this.controllers.entries()) {
            const rec = map.get(editor);
            if (!rec && factory.supportsGrammar(grammar.scopeName)) {
                const controller = new factory(editor, this);
                const disposable = new atom_1.CompositeDisposable();
                disposable.add(new atom_1.Disposable(() => {
                    map.delete(editor);
                    controller.destroy();
                }), editor.onDidDestroy(() => disposable.dispose()));
                map.set(editor, { controller, disposable });
            }
            else if (rec && !factory.supportsGrammar(grammar.scopeName)) {
                rec.disposable.dispose();
            }
        }
    }
    subscribeEditorController() {
        this.disposables.add(atom.workspace.observeTextEditors((editor) => {
            const editorDisp = new atom_1.CompositeDisposable();
            editorDisp.add(editor.onDidChangeGrammar((grammar) => {
                this.controllerOnGrammar(editor, grammar);
            }), editor.onDidDestroy(() => {
                editorDisp.dispose();
                this.disposables.remove(editorDisp);
            }));
            this.disposables.add(editorDisp);
            this.controllerOnGrammar(editor, editor.getGrammar());
        }));
    }
}
exports.PluginManager = PluginManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGx1Z2luLW1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcGx1Z2luLW1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFPYTtBQUNiLDZDQUF3QztBQUV4QyxtREFBMkU7QUFDM0UscURBQWdEO0FBQ2hELHFEQUFnRDtBQUNoRCx5REFBb0Q7QUFDcEQscUVBQStEO0FBQy9ELDZDQUE0QztBQUM1Qyx5Q0FBcUQ7QUFDckQsK0RBQXlEO0FBK0J6RDtJQXFCRSxZQUFZLEtBQWEsRUFBUyxXQUF3QjtRQUF4QixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtRQWZsRCxnQkFBVyxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQTtRQUN2QyxZQUFPLEdBT1gsSUFBSSxjQUFPLEVBQUUsQ0FBQTtRQUdULGdCQUFXLEdBQUcsSUFBSSxHQUFHLEVBRzFCLENBQUE7UUE2Q0kscUJBQWdCLEdBQUcsQ0FBQyxRQUFpQyxFQUFFLEVBQUUsQ0FDOUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFFeEMsb0JBQWUsR0FBRyxDQUFDLFFBQWlDLEVBQUUsRUFBRSxDQUM3RCxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUV2QyxzQkFBaUIsR0FBRyxDQUFDLFFBQWlDLEVBQUUsRUFBRSxDQUMvRCxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxRQUFRLENBQUMsQ0FBQTtRQWxEOUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBRWxDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxzQkFBUyxFQUFFLENBQUE7UUFDaEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBQy9D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QUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUQsR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtZQUMxQixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFHTyx5QkFBeUI7UUFDL0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQ2xCLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtZQUMzQyxNQUFNLFVBQVUsR0FBRyxJQUFJLDBCQUFtQixFQUFFLENBQUE7WUFDNUMsVUFBVSxDQUFDLEdBQUcsQ0FDWixNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDcEMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQTtZQUMzQyxDQUFDLENBQUMsRUFDRixNQUFNLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRTtnQkFDdkIsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFBO2dCQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUNyQyxDQUFDLENBQUMsQ0FDSCxDQUFBO1lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUE7WUFDaEMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQTtRQUN2RCxDQUFDLENBQUMsQ0FDSCxDQUFBO0lBQ0gsQ0FBQztDQUNGO0FBaE5ELHNDQWdOQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENvbXBvc2l0ZURpc3Bvc2FibGUsXG4gIEVtaXR0ZXIsXG4gIFRleHRFZGl0b3IsXG4gIFRleHRCdWZmZXIsXG4gIEdyYW1tYXIsXG4gIERpc3Bvc2FibGUsXG59IGZyb20gJ2F0b20nXG5pbXBvcnQgeyBSZXN1bHRzREIgfSBmcm9tICcuL3Jlc3VsdHMtZGInXG5pbXBvcnQgeyBPdXRwdXRQYW5lbCwgSVN0YXRlIGFzIElPdXRwdXRWaWV3U3RhdGUgfSBmcm9tICcuL291dHB1dC1wYW5lbCdcbmltcG9ydCB7IENvbmZpZ1BhcmFtTWFuYWdlciwgSVN0YXRlIGFzIElQYXJhbVN0YXRlIH0gZnJvbSAnLi9jb25maWctcGFyYW1zJ1xuaW1wb3J0IHsgRWRpdG9yQ29udHJvbCB9IGZyb20gJy4vZWRpdG9yLWNvbnRyb2wnXG5pbXBvcnQgeyBMaW50ZXJTdXBwb3J0IH0gZnJvbSAnLi9saW50ZXItc3VwcG9ydCdcbmltcG9ydCB7IFRvb2x0aXBSZWdpc3RyeSB9IGZyb20gJy4vdG9vbHRpcC1yZWdpc3RyeSdcbmltcG9ydCB7IENoZWNrUmVzdWx0c1Byb3ZpZGVyIH0gZnJvbSAnLi9jaGVjay1yZXN1bHRzLXByb3ZpZGVyJ1xuaW1wb3J0IHsgU3RhdHVzQmFyVmlldyB9IGZyb20gJy4vc3RhdHVzLWJhcidcbmltcG9ydCB7IFByZXR0aWZ5RWRpdG9yQ29udHJvbGxlciB9IGZyb20gJy4vcHJldHRpZnknXG5pbXBvcnQgeyBFZGl0b3JNYXJrQ29udHJvbCB9IGZyb20gJy4vZWRpdG9yLW1hcmstY29udHJvbCdcbmltcG9ydCAqIGFzIFVQSSBmcm9tICdhdG9tLWhhc2tlbGwtdXBpJ1xuaW1wb3J0ICogYXMgTGludGVyIGZyb20gJ2F0b20vbGludGVyJ1xuaW1wb3J0ICogYXMgU3RhdHVzQmFyIGZyb20gJ2F0b20vc3RhdHVzLWJhcidcblxuZXhwb3J0IHsgSVBhcmFtU3RhdGUsIElPdXRwdXRWaWV3U3RhdGUgfVxuXG5leHBvcnQgdHlwZSBURXZlbnRUeXBlID0gJ2tleWJvYXJkJyB8ICdjb250ZXh0JyB8ICdtb3VzZScgfCAnc2VsZWN0aW9uJ1xuXG5leHBvcnQgaW50ZXJmYWNlIElTdGF0ZSB7XG4gIGNvbmZpZ1BhcmFtczogSVBhcmFtU3RhdGVcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRWRpdG9yQ29udHJvbGxlciB7XG4gIGRlc3Ryb3koKTogdm9pZFxufVxuXG5leHBvcnQgdHlwZSBJRWRpdG9yQ29udHJvbGxlckZhY3RvcnkgPSBJRWRpdG9yQ29udHJvbGxlckZhY3RvcnlUPFxuICBJRWRpdG9yQ29udHJvbGxlclxuPlxuXG5leHBvcnQgaW50ZXJmYWNlIElFZGl0b3JDb250cm9sbGVyRmFjdG9yeVQ8VD4ge1xuICBuZXcgKGVkaXRvcjogVGV4dEVkaXRvciwgbWFuYWdlcjogUGx1Z2luTWFuYWdlcik6IFRcbiAgc3VwcG9ydHNHcmFtbWFyKGdyYW1tYXI6IHN0cmluZyk6IGJvb2xlYW5cbn1cblxuZXhwb3J0IHR5cGUgRUNNYXA8VCBleHRlbmRzIElFZGl0b3JDb250cm9sbGVyPiA9IFdlYWtNYXA8XG4gIFRleHRFZGl0b3IsXG4gIHsgY29udHJvbGxlcjogVDsgZGlzcG9zYWJsZTogRGlzcG9zYWJsZSB9XG4+XG5cbmV4cG9ydCBjbGFzcyBQbHVnaW5NYW5hZ2VyIHtcbiAgcHVibGljIHJlc3VsdHNEQjogUmVzdWx0c0RCXG4gIHB1YmxpYyBjb25maWdQYXJhbU1hbmFnZXI6IENvbmZpZ1BhcmFtTWFuYWdlclxuICBwdWJsaWMgdG9vbHRpcFJlZ2lzdHJ5OiBUb29sdGlwUmVnaXN0cnlcbiAgcHJpdmF0ZSBjaGVja1Jlc3VsdHNQcm92aWRlcj86IENoZWNrUmVzdWx0c1Byb3ZpZGVyXG4gIHByaXZhdGUgbGludGVyU3VwcG9ydD86IExpbnRlclN1cHBvcnRcbiAgcHJpdmF0ZSBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgcHJpdmF0ZSBlbWl0dGVyOiBFbWl0dGVyPFxuICAgIHt9LFxuICAgIHtcbiAgICAgICd3aWxsLXNhdmUtYnVmZmVyJzogVGV4dEJ1ZmZlclxuICAgICAgJ2RpZC1zYXZlLWJ1ZmZlcic6IFRleHRCdWZmZXJcbiAgICAgICdkaWQtc3RvcC1jaGFuZ2luZyc6IFRleHRCdWZmZXJcbiAgICB9XG4gID4gPSBuZXcgRW1pdHRlcigpXG4gIHByaXZhdGUgc3RhdHVzQmFyVGlsZT86IFN0YXR1c0Jhci5UaWxlXG4gIHByaXZhdGUgc3RhdHVzQmFyVmlldz86IFN0YXR1c0JhclZpZXdcbiAgcHJpdmF0ZSBjb250cm9sbGVycyA9IG5ldyBNYXA8XG4gICAgSUVkaXRvckNvbnRyb2xsZXJGYWN0b3J5LFxuICAgIEVDTWFwPElFZGl0b3JDb250cm9sbGVyPlxuICA+KClcbiAgY29uc3RydWN0b3Ioc3RhdGU6IElTdGF0ZSwgcHVibGljIG91dHB1dFBhbmVsOiBPdXRwdXRQYW5lbCkge1xuICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKHRoaXMuZW1pdHRlcilcblxuICAgIHRoaXMucmVzdWx0c0RCID0gbmV3IFJlc3VsdHNEQigpXG4gICAgdGhpcy5vdXRwdXRQYW5lbC5jb25uZWN0UmVzdWx0cyh0aGlzLnJlc3VsdHNEQilcbiAgICB0aGlzLnRvb2x0aXBSZWdpc3RyeSA9IG5ldyBUb29sdGlwUmVnaXN0cnkodGhpcylcbiAgICB0aGlzLmNvbmZpZ1BhcmFtTWFuYWdlciA9IG5ldyBDb25maWdQYXJhbU1hbmFnZXIoXG4gICAgICB0aGlzLm91dHB1dFBhbmVsLFxuICAgICAgc3RhdGUuY29uZmlnUGFyYW1zLFxuICAgIClcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKFxuICAgICAgdGhpcy5hZGRFZGl0b3JDb250cm9sbGVyKEVkaXRvckNvbnRyb2wpLFxuICAgICAgdGhpcy5hZGRFZGl0b3JDb250cm9sbGVyKFByZXR0aWZ5RWRpdG9yQ29udHJvbGxlciksXG4gICAgICB0aGlzLmFkZEVkaXRvckNvbnRyb2xsZXIoRWRpdG9yTWFya0NvbnRyb2wpLFxuICAgIClcbiAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC5tZXNzYWdlRGlzcGxheUZyb250ZW5kJykgPT09ICdidWlsdGluJykge1xuICAgICAgdGhpcy5jaGVja1Jlc3VsdHNQcm92aWRlciA9IG5ldyBDaGVja1Jlc3VsdHNQcm92aWRlcih0aGlzKVxuICAgIH1cblxuICAgIHRoaXMuc3Vic2NyaWJlRWRpdG9yQ29udHJvbGxlcigpXG4gIH1cblxuICBwdWJsaWMgZGVhY3RpdmF0ZSgpIHtcbiAgICB0aGlzLnJlc3VsdHNEQi5kZXN0cm95KClcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICAgIGlmICh0aGlzLmNoZWNrUmVzdWx0c1Byb3ZpZGVyKSB0aGlzLmNoZWNrUmVzdWx0c1Byb3ZpZGVyLmRlc3Ryb3koKVxuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWZsb2F0aW5nLXByb21pc2VzXG4gICAgdGhpcy5vdXRwdXRQYW5lbC5yZWFsbHlEZXN0cm95KClcbiAgICB0aGlzLmNvbmZpZ1BhcmFtTWFuYWdlci5kZXN0cm95KClcbiAgICB0aGlzLnJlbW92ZVN0YXR1c0JhcigpXG4gICAgaWYgKHRoaXMubGludGVyU3VwcG9ydCkge1xuICAgICAgdGhpcy5saW50ZXJTdXBwb3J0LmRlc3Ryb3koKVxuICAgICAgdGhpcy5saW50ZXJTdXBwb3J0ID0gdW5kZWZpbmVkXG4gICAgfVxuICB9XG5cbiAgcHVibGljIHNlcmlhbGl6ZSgpOiBJU3RhdGUge1xuICAgIHJldHVybiB7XG4gICAgICBjb25maWdQYXJhbXM6IHRoaXMuY29uZmlnUGFyYW1NYW5hZ2VyLnNlcmlhbGl6ZSgpLFxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBvbldpbGxTYXZlQnVmZmVyID0gKGNhbGxiYWNrOiBVUEkuVFRleHRCdWZmZXJDYWxsYmFjaykgPT5cbiAgICB0aGlzLmVtaXR0ZXIub24oJ3dpbGwtc2F2ZS1idWZmZXInLCBjYWxsYmFjaylcblxuICBwdWJsaWMgb25EaWRTYXZlQnVmZmVyID0gKGNhbGxiYWNrOiBVUEkuVFRleHRCdWZmZXJDYWxsYmFjaykgPT5cbiAgICB0aGlzLmVtaXR0ZXIub24oJ2RpZC1zYXZlLWJ1ZmZlcicsIGNhbGxiYWNrKVxuXG4gIHB1YmxpYyBvbkRpZFN0b3BDaGFuZ2luZyA9IChjYWxsYmFjazogVVBJLlRUZXh0QnVmZmVyQ2FsbGJhY2spID0+XG4gICAgdGhpcy5lbWl0dGVyLm9uKCdkaWQtc3RvcC1jaGFuZ2luZycsIGNhbGxiYWNrKVxuXG4gIHB1YmxpYyB3aWxsU2F2ZUJ1ZmZlcihidWZmZXI6IFRleHRCdWZmZXIpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLmVtaXQoJ3dpbGwtc2F2ZS1idWZmZXInLCBidWZmZXIpXG4gIH1cblxuICBwdWJsaWMgZGlkU2F2ZUJ1ZmZlcihidWZmZXI6IFRleHRCdWZmZXIpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1zYXZlLWJ1ZmZlcicsIGJ1ZmZlcilcbiAgfVxuXG4gIHB1YmxpYyBkaWRTdG9wQ2hhbmdpbmcoYnVmZmVyOiBUZXh0QnVmZmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtc3RvcC1jaGFuZ2luZycsIGJ1ZmZlcilcbiAgfVxuXG4gIHB1YmxpYyB0b2dnbGVQYW5lbCgpIHtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tZmxvYXRpbmctcHJvbWlzZXNcbiAgICBhdG9tLndvcmtzcGFjZS50b2dnbGUodGhpcy5vdXRwdXRQYW5lbClcbiAgfVxuXG4gIHB1YmxpYyBjb250cm9sbGVyKGVkaXRvcjogVGV4dEVkaXRvcik6IEVkaXRvckNvbnRyb2wgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbnRyb2xsZXJUeXBlKEVkaXRvckNvbnRyb2wsIGVkaXRvcilcbiAgfVxuXG4gIHB1YmxpYyBjb250cm9sbGVyVHlwZTxcbiAgICBVIGV4dGVuZHMgSUVkaXRvckNvbnRyb2xsZXIsXG4gICAgVCBleHRlbmRzIElFZGl0b3JDb250cm9sbGVyRmFjdG9yeVQ8VT5cbiAgPihmYWN0b3J5OiBULCBlZGl0b3I6IFRleHRFZGl0b3IpOiBVIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBlY21hcCA9IHRoaXMuY29udHJvbGxlcnMuZ2V0KGZhY3RvcnkpXG4gICAgY29uc3QgcmVjID0gZWNtYXAgPyBlY21hcC5nZXQoZWRpdG9yKSA6IHVuZGVmaW5lZFxuICAgIHJldHVybiByZWMgPyAocmVjLmNvbnRyb2xsZXIgYXMgVSkgOiB1bmRlZmluZWRcbiAgfVxuXG4gIHB1YmxpYyBzZXRMaW50ZXIobGludGVyOiBMaW50ZXIuSW5kaWVEZWxlZ2F0ZSkge1xuICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLm1lc3NhZ2VEaXNwbGF5RnJvbnRlbmQnKSAhPT0gJ2xpbnRlcicpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmxpbnRlclN1cHBvcnQgPSBuZXcgTGludGVyU3VwcG9ydChsaW50ZXIsIHRoaXMucmVzdWx0c0RCKVxuICB9XG5cbiAgcHVibGljIG5leHRFcnJvcigpIHtcbiAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdpZGUtaGFza2VsbC5tZXNzYWdlRGlzcGxheUZyb250ZW5kJykgIT09ICdidWlsdGluJykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMub3V0cHV0UGFuZWwuc2hvd05leHRFcnJvcigpXG4gIH1cblxuICBwdWJsaWMgcHJldkVycm9yKCkge1xuICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2lkZS1oYXNrZWxsLm1lc3NhZ2VEaXNwbGF5RnJvbnRlbmQnKSAhPT0gJ2J1aWx0aW4nKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5vdXRwdXRQYW5lbC5zaG93UHJldkVycm9yKClcbiAgfVxuXG4gIHB1YmxpYyBiYWNrZW5kU3RhdHVzKHBsdWdpbk5hbWU6IHN0cmluZywgc3Q6IFVQSS5JU3RhdHVzKSB7XG4gICAgdGhpcy5vdXRwdXRQYW5lbC5iYWNrZW5kU3RhdHVzKHBsdWdpbk5hbWUsIHN0KVxuICAgIGlmICh0aGlzLnN0YXR1c0JhclZpZXcpIHtcbiAgICAgIHRoaXMuc3RhdHVzQmFyVmlldy5iYWNrZW5kU3RhdHVzKHBsdWdpbk5hbWUsIHN0KVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhZGRFZGl0b3JDb250cm9sbGVyPFxuICAgIFUgZXh0ZW5kcyBJRWRpdG9yQ29udHJvbGxlcixcbiAgICBUIGV4dGVuZHMgSUVkaXRvckNvbnRyb2xsZXJGYWN0b3J5VDxVPlxuICA+KGZhY3Rvcnk6IFQpOiBEaXNwb3NhYmxlIHtcbiAgICBpZiAodGhpcy5jb250cm9sbGVycy5oYXMoZmFjdG9yeSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRHVwbGljYXRlIGNvbnRyb2xsZXIgZmFjdG9yeSAke2ZhY3RvcnkudG9TdHJpbmcoKX1gKVxuICAgIH1cbiAgICBjb25zdCBtYXA6IEVDTWFwPFU+ID0gbmV3IFdlYWtNYXAoKVxuICAgIHRoaXMuY29udHJvbGxlcnMuc2V0KGZhY3RvcnksIG1hcClcbiAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgdGhpcy5jb250cm9sbGVycy5kZWxldGUoZmFjdG9yeSlcbiAgICAgIGZvciAoY29uc3QgdGUgb2YgYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKSkge1xuICAgICAgICBjb25zdCByZWMgPSBtYXAuZ2V0KHRlKVxuICAgICAgICBpZiAocmVjKSByZWMuZGlzcG9zYWJsZS5kaXNwb3NlKClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgcHVibGljIHNldFN0YXR1c0JhcihzYjogU3RhdHVzQmFyLlN0YXR1c0Jhcikge1xuICAgIHRoaXMuc3RhdHVzQmFyVmlldyA9IG5ldyBTdGF0dXNCYXJWaWV3KHRoaXMub3V0cHV0UGFuZWwpXG4gICAgdGhpcy5zdGF0dXNCYXJUaWxlID0gc2IuYWRkUmlnaHRUaWxlKHtcbiAgICAgIGl0ZW06IHRoaXMuc3RhdHVzQmFyVmlldy5lbGVtZW50LFxuICAgICAgcHJpb3JpdHk6IDEwMCxcbiAgICB9KVxuICB9XG5cbiAgcHVibGljIHJlbW92ZVN0YXR1c0JhcigpIHtcbiAgICBpZiAodGhpcy5zdGF0dXNCYXJUaWxlKSB7XG4gICAgICB0aGlzLnN0YXR1c0JhclRpbGUuZGVzdHJveSgpXG4gICAgICB0aGlzLnN0YXR1c0JhclRpbGUgPSB1bmRlZmluZWRcbiAgICB9XG4gICAgaWYgKHRoaXMuc3RhdHVzQmFyVmlldykge1xuICAgICAgdGhpcy5zdGF0dXNCYXJWaWV3LmRlc3Ryb3koKVxuICAgICAgdGhpcy5zdGF0dXNCYXJWaWV3ID0gdW5kZWZpbmVkXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjb250cm9sbGVyT25HcmFtbWFyKGVkaXRvcjogVGV4dEVkaXRvciwgZ3JhbW1hcjogR3JhbW1hcikge1xuICAgIGZvciAoY29uc3QgW2ZhY3RvcnksIG1hcF0gb2YgdGhpcy5jb250cm9sbGVycy5lbnRyaWVzKCkpIHtcbiAgICAgIGNvbnN0IHJlYyA9IG1hcC5nZXQoZWRpdG9yKVxuICAgICAgaWYgKCFyZWMgJiYgZmFjdG9yeS5zdXBwb3J0c0dyYW1tYXIoZ3JhbW1hci5zY29wZU5hbWUpKSB7XG4gICAgICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgZmFjdG9yeShlZGl0b3IsIHRoaXMpXG4gICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKFxuICAgICAgICAgIG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgICAgICAgIG1hcC5kZWxldGUoZWRpdG9yKVxuICAgICAgICAgICAgY29udHJvbGxlci5kZXN0cm95KClcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IGRpc3Bvc2FibGUuZGlzcG9zZSgpKSxcbiAgICAgICAgKVxuICAgICAgICBtYXAuc2V0KGVkaXRvciwgeyBjb250cm9sbGVyLCBkaXNwb3NhYmxlIH0pXG4gICAgICB9IGVsc2UgaWYgKHJlYyAmJiAhZmFjdG9yeS5zdXBwb3J0c0dyYW1tYXIoZ3JhbW1hci5zY29wZU5hbWUpKSB7XG4gICAgICAgIHJlYy5kaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIE9ic2VydmUgdGV4dCBlZGl0b3JzIHRvIGF0dGFjaCBjb250cm9sbGVyXG4gIHByaXZhdGUgc3Vic2NyaWJlRWRpdG9yQ29udHJvbGxlcigpIHtcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChcbiAgICAgIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygoZWRpdG9yKSA9PiB7XG4gICAgICAgIGNvbnN0IGVkaXRvckRpc3AgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgICAgIGVkaXRvckRpc3AuYWRkKFxuICAgICAgICAgIGVkaXRvci5vbkRpZENoYW5nZUdyYW1tYXIoKGdyYW1tYXIpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY29udHJvbGxlck9uR3JhbW1hcihlZGl0b3IsIGdyYW1tYXIpXG4gICAgICAgICAgfSksXG4gICAgICAgICAgZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3JEaXNwLmRpc3Bvc2UoKVxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlcy5yZW1vdmUoZWRpdG9yRGlzcClcbiAgICAgICAgICB9KSxcbiAgICAgICAgKVxuICAgICAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChlZGl0b3JEaXNwKVxuICAgICAgICB0aGlzLmNvbnRyb2xsZXJPbkdyYW1tYXIoZWRpdG9yLCBlZGl0b3IuZ2V0R3JhbW1hcigpKVxuICAgICAgfSksXG4gICAgKVxuICB9XG59XG4iXX0=