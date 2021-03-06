"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
class TooltipMessage {
    constructor(message) {
        if (Array.isArray(message)) {
            this.message = message.map((m) => etch.dom("div", { key: m, innerHTML: m.toHtml() }));
        }
        else {
            this.message = [etch.dom("div", { key: message, innerHTML: message.toHtml() })];
        }
        etch.initialize(this);
    }
    render() {
        return etch.dom("ide-haskell-tooltip", null, this.message);
    }
    async update() {
        return etch.update(this);
    }
    writeAfterUpdate() {
        if (this.element.parentElement) {
            this.element.parentElement.classList.add('ide-haskell');
        }
    }
}
exports.TooltipMessage = TooltipMessage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHRpcC12aWV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2VkaXRvci1jb250cm9sL3Rvb2x0aXAtdmlldy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2QkFBNEI7QUFHNUI7SUFHRSxZQUFZLE9BQXdDO1FBQ2xELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsa0JBQUssR0FBRyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFJLENBQUMsQ0FBQTtRQUMzRSxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsa0JBQUssR0FBRyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFJLENBQUMsQ0FBQTtRQUNyRSxDQUFDO1FBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUN2QixDQUFDO0lBRU0sTUFBTTtRQUNYLE1BQU0sQ0FBQyxzQ0FBc0IsSUFBSSxDQUFDLE9BQU8sQ0FBdUIsQ0FBQTtJQUNsRSxDQUFDO0lBRU0sS0FBSyxDQUFDLE1BQU07UUFDakIsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDMUIsQ0FBQztJQUVNLGdCQUFnQjtRQUNyQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUN6RCxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBekJELHdDQXlCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGV0Y2ggZnJvbSAnZXRjaCdcbmltcG9ydCB7IE1lc3NhZ2VPYmplY3QgfSBmcm9tICcuLi91dGlscydcblxuZXhwb3J0IGNsYXNzIFRvb2x0aXBNZXNzYWdlIHtcbiAgcHJpdmF0ZSBtZXNzYWdlOiBKU1guRWxlbWVudFtdXG4gIHByaXZhdGUgZWxlbWVudCE6IEhUTUxFbGVtZW50XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IE1lc3NhZ2VPYmplY3QgfCBNZXNzYWdlT2JqZWN0W10pIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShtZXNzYWdlKSkge1xuICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZS5tYXAoKG0pID0+IDxkaXYga2V5PXttfSBpbm5lckhUTUw9e20udG9IdG1sKCl9IC8+KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1lc3NhZ2UgPSBbPGRpdiBrZXk9e21lc3NhZ2V9IGlubmVySFRNTD17bWVzc2FnZS50b0h0bWwoKX0gLz5dXG4gICAgfVxuICAgIGV0Y2guaW5pdGlhbGl6ZSh0aGlzKVxuICB9XG5cbiAgcHVibGljIHJlbmRlcigpIHtcbiAgICByZXR1cm4gPGlkZS1oYXNrZWxsLXRvb2x0aXA+e3RoaXMubWVzc2FnZX08L2lkZS1oYXNrZWxsLXRvb2x0aXA+XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgdXBkYXRlKCkge1xuICAgIHJldHVybiBldGNoLnVwZGF0ZSh0aGlzKVxuICB9XG5cbiAgcHVibGljIHdyaXRlQWZ0ZXJVcGRhdGUoKSB7XG4gICAgaWYgKHRoaXMuZWxlbWVudC5wYXJlbnRFbGVtZW50KSB7XG4gICAgICB0aGlzLmVsZW1lbnQucGFyZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdpZGUtaGFza2VsbCcpXG4gICAgfVxuICB9XG59XG4iXX0=