const NoGroup = chrome.tabGroups.TAB_GROUP_ID_NONE,
    QueryInWindow = {
        windowId: chrome.windows.WINDOW_ID_CURRENT
    },
    NoName = chrome.i18n.getMessage("NoName");

function createColorSpan(a) {
    let b = document.createElement("span");
    b.className = "d-inline-block rounded-circle size-18 align-text-bottom me-2";
    a ? b.style.backgroundColor = ColorMap[a] : b.classList.add("border");
    return b
}

function createFavicon(a, b) {
    b = document.createElement("img");
    b.className = "size-18 align-text-bottom mr-10";
    a ? (b.src = a, b.addEventListener("error", c => {
        c.target.src = "img/favicon.icon"
    })) : b.src = "img/favicon.icon";
    return b
}

function escForBlur(a) {
    27 === a.keyCode && (a.stopPropagation(), a.preventDefault(), this.blur())
}

function delay(a, b) {
    let c = 0;
    return function(...d) {
        clearTimeout(c);
        c = setTimeout(a.bind(this, ...d), b)
    }
}
const successTip = new bootstrap.Toast(document.getElementById("successTip"), {
    animation: !0,
    autohide: !0,
    delay: 1E3
});

function showSuccessTip(a) {
    a || (a = chrome.i18n.getMessage("Saved"));
    document.getElementById("successTip").firstElementChild.textContent = a;
    successTip.show()
}
class Group {
    static init() {
        Group.container = document.getElementById("current-tab-list");
        Group.collapseAll = document.getElementById("current-collapse-all");
        Group.collapseAll.addEventListener("click", Group.toggleCollpaseAll);
        Group.setupCurrentTabs();
        chrome.tabGroups.onRemoved.addListener(Group.onGroupRemoved);
        chrome.tabs.onUpdated.addListener(Group.onTabUpdated);
        chrome.tabs.onCreated.addListener(Group.onTabCreated);
        chrome.tabs.onRemoved.addListener(Group.onTabRemoved);
        Group.delayRefresh = delay(Group.setupCurrentTabs,
            500);
        Group.initMoveMenu()
    }
    static initMoveMenu() {
        Group.dropdownMoveMenu = document.getElementById("dropdown-move-to");
        Group.dropdownMoveMenu.children[1].firstElementChild.addEventListener("click", Group.onMoveMenuItemClick);
        chrome.windows.getCurrent({
            windowTypes: ["normal"]
        }, function(a) {
            Group.currentWindowId = a.id
        })
    }
    static refreshMoveMenu() {
        chrome.windows.getAll({
            windowTypes: ["normal"],
            populate: !0
        }, function(a) {
            a = a.filter(e => e.id != Group.currentWindowId);
            let [, , b, c, ...d] = Group.dropdownMoveMenu.children;
            for (let e of d) e.remove();
            0 < a.length ? (b.classList.remove("d-none"), c.classList.remove("d-none"), a.forEach(Group.createMoveMenuItem)) : (b.classList.add("d-none"), c.classList.add("d-none"))
        })
    }
    static createMoveMenuItem(a) {
        let b = document.createElement("li"),
            c = document.createElement("button");
        c.type = "button";
        c.className = "dropdown-item text-truncate";
        c.dataset.target = a.id;
        c.addEventListener("click", Group.onMoveMenuItemClick);
        for (let d of a.tabs) a = createFavicon(d.favIconUrl), a.title = d.title, c.appendChild(a);
        b.appendChild(c);
        Group.dropdownMoveMenu.appendChild(b)
    }
    static setupCurrentTabs() {
        chrome.tabGroups.query(QueryInWindow,
            function(a) {
                const b = new Map(a.map(c => [c.id, c]));
                chrome.tabs.query(QueryInWindow, function(c) {
                    var d = [];
                    let e = -1;
                    for (let g of c) c = g.groupId, c === NoGroup ? d.push(Group.createTab(g, !1)) : (c !== e && (e = c, (c = b.get(c)) && d.push(Group.createGroup(c))), d.push(Group.createTab(g, !0)));
                    Group.container.replaceChildren(...d);
                    d = Group.container.querySelectorAll('img[src="img/background.jpg"]');
                    for (let g of d) Group.setUICollpase(g, !0);
                    0 == d.length && Group.updateCollpaseAllBtn()
                })
            })
    }
    static createMoveWindowTD() {
        let a = document.createElement("td"),
            b = document.createElement("a"),
            c = document.createElement("img");
        c.src = "img/background.jpg";
        c.className = "pointer size-24";
        b.href = "#";
        b.addEventListener("click", Group.onMoveMenuClick);
        a.className = "dropdown dropstart";
        b.appendChild(c);
        a.appendChild(b);
        return a
    }
    static createCloseTD() {
        let a = document.createElement("td"),
            b = document.createElement("img");
        b.src = "img/background.jpg";
        b.className = "pointer size-24";
        b.addEventListener("click", Group.onCloseClick);
        a.appendChild(b);
        return a
    }
    static createTab(a, b) {
        let c =
            document.createElement("tr"),
            d = document.createElement("td");
        var e = createFavicon(a.favIconUrl, a.url);
        let g = document.createElement("span"),
            h = Group.createMoveWindowTD(),
            k = document.createElement("td"),
            f = Group.createCloseTD();
        c.id = "ctab-" + a.id;
        b && d.classList.add("tab-in-group");
        g.textContent = a.title;
        b = document.createElement("div");
        b.className = "text-truncate pointer";
        b.appendChild(e);
        b.appendChild(g);
        b.addEventListener("click", Group.onTabClick);
        b.title = a.url;
        d.appendChild(b);
        d.colSpan = 3;
        e = document.createElement("img");
        e.src = "img/background.jpg";
        e.className = "pointer";
        e.addEventListener("click", Group.onTabSnapshotClick);
        k.appendChild(e);
        Group.setTabState(a, d);
        c.appendChild(d);
        c.appendChild(h);
        c.appendChild(k);
        c.appendChild(f);
        return c
    }
    static setTabState(a, b) {
        a.active && b.classList.add("active-indicator");
        let c = !1;
        if (a.mutedInfo?.muted) var d = "img/background.jpg";
        else a.audible ? (c = !0, d = "img/background.jpg") : a.pinned && (d = "img/background.jpg");
        d && (a = document.createElement("img"), a.src = d, a.className = "state-indicator",
            b.classList.add("position-relative"), b.appendChild(a), c && (d = document.createElement("img"), d.src = "img/background.jpg", d.className = "state-indicator audible-animate", b.appendChild(d)))
    }
    static onTabUpdated(a, b, c) {
        if (a = document.getElementById("ctab-" + a)) {
            let d = a.firstElementChild.firstElementChild,
                e, g;
            1 == d.childElementCount ? g = d.firstElementChild : (e = d.firstElementChild, g = e.nextElementSibling);
            b.url && (d.title = b.url);
            b.title && (g.textContent = b.title);
            b.favIconUrl && e && (e.src = b.favIconUrl);
            if (void 0 !== b.audible ||
                void 0 !== b.mutedInfo || void 0 !== b.pinned) a.querySelectorAll(".state-indicator").forEach(h => h.remove()), Group.setTabState(c, a.firstElementChild)
        }
        0 < b.groupId && Group.delayRefresh()
    }
    static onTabCreated(a) {
        a.windowId === Group.currentWindowId && Group.delayRefresh()
    }
    static createGroup(a) {
        let b = document.createElement("tr"),
            c = document.createElement("td"),
            d = Group.createMoveWindowTD(),
            e = document.createElement("td"),
            g = Group.createCloseTD(),
            h = document.createElement("td"),
            k = document.createElement("td");
        b.id = "cgroup-" +
            a.id;
        c.className = "text-truncate";
        var f = document.createElement("span");
        f.className = "group-name text-truncate";
        f.dataset.placeholder = NoName;
        a.title && (f.textContent = a.title);
        f.addEventListener("click", Group.spanToInput);
        let l = document.createElement("input");
        l.type = "text";
        l.spellcheck = !1;
        l.className = "d-none group-name";
        l.placeholder = NoName;
        a.title && (l.value = a.title);
        var m = delay(function() {
            let p = this.value,
                q = parseInt(this.closest("tr").id.split("-")[1], 10);
            chrome.tabGroups.update(q, {
                title: p
            })
        }, 800);
        l.addEventListener("input",
            m);
        l.addEventListener("blur", Group.inputToSpan);
        l.addEventListener("keydown", escForBlur);
        m = createColorSpan(a.color);
        m.classList.add("pointer");
        m.addEventListener("click", Group.onColorClick);
        let n = document.createElement("img");
        n.src = "img/background.jpg";
        n.className = "size-18 mx-1 align-text-bottom d-none";
        c.appendChild(m);
        c.appendChild(f);
        c.appendChild(l);
        c.appendChild(n);
        f = document.createElement("img");
        f.src = "img/background.jpg";
        f.className = "pointer size-24";
        f.addEventListener("click", Group.onNewtabClick);
        e.appendChild(f);
        f = document.createElement("img");
        f.className = "pointer size-24";
        Group.setCollpaseBtn(f, a.collapsed);
        f.addEventListener("click", Group.onCollapseClick);
        h.className = "expand";
        h.appendChild(f);
        a = document.createElement("img");
        a.src = "img/background.jpg";
        a.className = "pointer";
        a.addEventListener("click", Group.onGroupSnapshotClick);
        k.appendChild(a);
        b.appendChild(c);
        b.appendChild(h);
        b.appendChild(e);
        b.appendChild(d);
        b.appendChild(k);
        b.appendChild(g);
        return b
    }
    static spanToInput(a) {
        this.classList.add("d-none");
        a = this.nextElementSibling;
        a.classList.remove("d-none");
        a.focus()
    }
    static inputToSpan(a) {
        this.classList.add("d-none");
        a = this.previousElementSibling;
        a.textContent = this.value;
        a.classList.remove("d-none")
    }
    static updateCollpaseAllBtn() {
        let a = Group.container.querySelectorAll('img[src="img/background.jpg"]').length,
            b = Group.container.querySelectorAll('img[src="img/background.jpg"]').length;
        Group.collapseAll.src = 0 == a + b || 0 < b ? "img/background.jpg" : "img/background.jpg"
    }
    static toggleCollpaseAll(a) {
        a = this.src.endsWith("img/background.jpg") ?
            Group.container.querySelectorAll('img[src="img/background.jpg"]') : Group.container.querySelectorAll('img[src="img/background.jpg"]');
        for (let b of a) b.click()
    }
    static setCollpaseBtn(a, b) {
        a.src = b ? "img/background.jpg" : "img/background.jpg"
    }
    static setUICollpase(a, b) {
        const c = a.closest("tr");
        a = c.firstElementChild;
        const d = a.firstElementChild,
            e = d.nextElementSibling.nextElementSibling.nextElementSibling;
        "DIV" == a.lastElementChild.tagName && a.lastElementChild.remove();
        if (b)
            for (d.classList.add("group"), e.classList.remove("d-none"),
                b = c.nextElementSibling; b && b.firstElementChild.classList.contains("tab-in-group");) a.appendChild(b.firstElementChild.firstElementChild.firstElementChild), b.classList.add("d-none"), b = b.nextElementSibling;
        else
            for (d.classList.remove("group"), e.classList.add("d-none"), b = c.nextElementSibling; b && b.firstElementChild.classList.contains("tab-in-group");) b.firstElementChild.firstElementChild.prepend(e.nextElementSibling), b.classList.remove("d-none"), b = b.nextElementSibling;
        Group.updateCollpaseAllBtn()
    }
    static onCollapseClick(a) {
        a.preventDefault();
        const b = this,
            c = parseInt(this.closest("tr").id.split("-")[1], 10);
        chrome.tabGroups.get(c, d => {
            chrome.tabGroups.update(c, {
                collapsed: !d.collapsed
            }, e => {
                Group.setCollpaseBtn(b, e.collapsed);
                Group.setUICollpase(b, e.collapsed)
            })
        })
    }
    static onColorClick(a) {
        a = this.parentElement;
        if ("DIV" == a.lastElementChild.tagName) a.lastElementChild.remove();
        else {
            var b = parseInt(this.closest("tr").id.split("-")[1], 10),
                c = document.createElement("div");
            c.className = "mt-1";
            for (let d of Object.keys(ColorMap)) {
                let e = createColorSpan(d);
                e.classList.add("pointer");
                e.addEventListener("click", g => {
                    chrome.tabGroups.update(b, {
                        color: d
                    });
                    this.style.backgroundColor = ColorMap[d]
                });
                c.appendChild(e)
            }
            a.appendChild(c)
        }
    }
    static onCloseClick(a) {
        a = this.closest("tr").id.split("-");
        const b = parseInt(a[1], 10);
        "ctab" == a[0] ? chrome.tabs.remove(b) : chrome.tabs.query(QueryInWindow, function(c) {
            c = c.filter(d => d.groupId === b).map(d => d.id);
            chrome.tabs.remove(c)
        })
    }
    static onGroupRemoved(a) {
        (a = document.getElementById("cgroup-" + a.id)) && a.remove()
    }
    static onTabRemoved(a,
        b) {
        (a = document.getElementById("ctab-" + a)) && a.remove()
    }
    static onTabClick(a) {
        a = this.closest("tr").id.split("-");
        "ctab" == a[0] && chrome.tabs.update(parseInt(a[1], 10), {
            active: !0
        })
    }
    static async onGroupSnapshotClick(a) {
        a = parseInt(this.closest("tr").id.split("-")[1], 10);
        await GroupStore.snapshotGroup(a) && (SavedGroup.refresh(), showSuccessTip())
    }
    static async onTabSnapshotClick(a) {
        a = parseInt(this.closest("tr").id.split("-")[1], 10);
        await GroupStore.snapshotTab(a) && (SavedGroup.refresh(), showSuccessTip())
    }
    static onMoveMenuClick(a) {
        a.preventDefault();
        a = this.closest("tr").id.split("-");
        Group.dropdownMoveMenu.dataset.targetId = parseInt(a[1], 10);
        Group.dropdownMoveMenu.dataset.targetType = "ctab" == a[0] ? "tab" : "group";
        this.nextElementSibling !== Group.dropdownMoveMenu && this.parentElement.appendChild(Group.dropdownMoveMenu);
        this.dataset.bsToggle || (this.dataset.bsToggle = "dropdown", this.addEventListener("show.bs.dropdown", Group.refreshMoveMenu), (new bootstrap.Dropdown(this, {
            display: "static"
        })).show())
    }
    static onMoveMenuItemClick(a) {
        a = parseInt(Group.dropdownMoveMenu.dataset.targetId,
            10);
        a = {
            type: "MoveToWindow",
            moveType: Group.dropdownMoveMenu.dataset.targetType,
            id: a
        };
        this.dataset.target && (a.windowId = parseInt(this.dataset.target, 10));
        chrome.runtime.sendMessage(a)
    }
    static onNewtabClick(a) {
        const b = parseInt(this.closest("tr").id.split("-")[1], 10);
        chrome.tabs.create({
            active: !1
        }, function(c) {
            chrome.tabs.group({
                groupId: b,
                tabIds: c.id
            }, function() {
                chrome.tabs.update(c.id, {
                    active: !0
                })
            })
        })
    }
}
var isMacOS = !1;
class SavedGroup {
    static init() {
        SavedGroup.container = document.getElementById("saved-group-list");
        SavedGroup.timeFormat = new Intl.DateTimeFormat(void 0, {
            dateStyle: "short",
            timeStyle: "medium"
        });
        SavedGroup.collapseAll = document.getElementById("saved-collapse-all");
        SavedGroup.collapseAll.addEventListener("click", SavedGroup.toggleCollpaseAll);
        document.getElementById("saved-delete-all").addEventListener("click", SavedGroup.deleteAll);
        document.getElementById("saved-merge-all").addEventListener("click", SavedGroup.onMergeAllClick);
        SavedGroup.tabEditor = new bootstrap.Modal(document.getElementById("saved-editor"));
        document.getElementById("saved-edit-save").addEventListener("click", SavedGroup.saveEdit);
        SavedGroup.tabEditTitle = document.getElementById("saved-edit-title");
        SavedGroup.tabEditUrl = document.getElementById("saved-edit-url");
        SavedGroup.initAddMenu();
        SavedGroup.fileInput = document.querySelector("input[type=file]");
        SavedGroup.fileInput.addEventListener("change", SavedGroup.importJson);
        let [a, b, c] = document.querySelectorAll("#saved-data-menu button");
        a.addEventListener("click", d => SavedGroup.fileInput.click());
        b.addEventListener("click", d => GroupStore.exportJson());
        c.addEventListener("click", d => GroupStore.exportHtml());
        chrome.storage.sync.get({
            "max-snapshots": 5,
            "s-expand": "expand"
        }, function(d) {
            SavedGroup.maxSnapshots = d["max-snapshots"];
            let e = document.getElementById("max-snapshots");
            e.value = SavedGroup.maxSnapshots;
            let g = delay(SavedGroup.saveMaxSnapshots, 900);
            e.addEventListener("input", g);
            SavedGroup.defaultCollapse = "collapse" === d["s-expand"];
            d = document.getElementById("saved-expand-state");
            d.checked = SavedGroup.defaultCollapse;
            d.addEventListener("click", SavedGroup.saveDefaultExpand);
            SavedGroup.setupSavedGroups()
        });
        chrome.runtime.getPlatformInfo(function(d) {
            if (isMacOS = "mac" === d.os) {
                d = ["pT2Tip", "kb-ctrl-enter", "kb-ctrl-o"];
                for (let e of d) d = document.getElementById(e), d.innerHTML = d.innerHTML.replace("Ctrl", "\u2318")
            }
        })
    }
    static initAddMenu() {
        SavedGroup.dropdownAddMenu = document.getElementById("dropdown-add-to");
        SavedGroup.dropdownAddMenu.querySelector("button").addEventListener("click", SavedGroup.saveAdd)
    }
    static saveMaxSnapshots() {
        let a =
            parseInt(this.value, 10);
        0 < a && (SavedGroup.maxSnapshots = a, chrome.storage.sync.set({
            "max-snapshots": a
        }))
    }
    static saveDefaultExpand(a) {
        SavedGroup.defaultCollapse = this.checked;
        chrome.storage.sync.set({
            "s-expand": this.checked ? "collapse" : "expand"
        })
    }
    static refresh() {
        SavedGroup.setupSavedGroups()
    }
    static setNoRecord() {
        let a = document.getElementById("no-saved-groups").content.cloneNode(!0);
        initMsg(a);
        SavedGroup.container.appendChild(a)
    }
    static async setupSavedGroups() {
        var a = await GroupStore.getAll();
        let b = [];
        for (let c of a)
            if ("group" ===
                c.type) {
                b.push(SavedGroup.createGroup(c));
                for (let d of c.tabs) b.push(SavedGroup.createTab(d, c))
            } else "tab" === c.type && b.push(SavedGroup.createTab(c, !1));
        SavedGroup.container.replaceChildren(...b);
        if (0 == a.length) SavedGroup.setNoRecord();
        else if (SavedGroup.defaultCollapse) {
            a = SavedGroup.container.querySelectorAll('img[src="img/background.jpg"]');
            for (let c of a) c.click()
        } else SavedGroup.updateCollpaseAllBtn()
    }
    static createDeleteBtn() {
        let a = document.createElement("img");
        a.src = "img/background.jpg";
        a.className = "pointer";
        return a
    }
    static createTab(a, b) {
        let c = document.createElement("tr"),
            d = document.createElement("td");
        var e = document.createElement("div"),
            g = createFavicon(a.favIconUrl);
        let h = document.createElement("span"),
            k = document.createElement("td"),
            f = SavedGroup.createDeleteBtn();
        const l = a.url;
        e.className = "text-truncate pointer";
        h.textContent = a.title;
        e.appendChild(g);
        e.appendChild(h);
        e.title = l;
        f.addEventListener("click", SavedGroup.deleteTab);
        k.appendChild(f);
        b ? (d.classList.add("tab-in-group"),
            e.addEventListener("click", m => {
                chrome.runtime.sendMessage({
                    type: "OpenTab",
                    url: l,
                    mode: SavedGroup.getOpenMode(m),
                    groupName: b.title,
                    groupColor: b.color
                })
            })) : (c.id = a.id, e.addEventListener("click", m => SavedGroup.openTab(m, l)));
        d.colSpan = 3;
        d.appendChild(e);
        e = document.createElement("td");
        g = document.createElement("img");
        g.src = "img/background.jpg";
        g.className = "pointer";
        g.addEventListener("click", m => SavedGroup.showEdit(c, a));
        e.appendChild(g);
        c.appendChild(d);
        c.appendChild(e);
        c.appendChild(k);
        return c
    }
    static createGroup(a) {
        let b =
            document.createElement("tr"),
            c = document.createElement("td"),
            d = document.createElement("td"),
            e = document.createElement("td"),
            g = document.createElement("td");
        var h = SavedGroup.createDeleteBtn();
        b.id = a.id;
        c.className = "text-truncate pointer";
        c.title = chrome.i18n.getMessage("pT2GroupTitle");
        var k = document.createElement("span");
        k.title = "";
        k.className = "group-name text-truncate";
        k.dataset.placeholder = NoName;
        a.title && (k.textContent = a.title);
        k.addEventListener("click", SavedGroup.spanToInput);
        var f = document.createElement("input");
        f.title = "";
        f.type = "text";
        f.spellcheck = !1;
        f.className = "d-none group-name";
        f.placeholder = NoName;
        a.title && (f.value = a.title);
        var l = delay(async function() {
            let m = this.value,
                n = this.closest("tr").id;
            await GroupStore.updateGroupName(n, m) && showSuccessTip()
        }, 800);
        f.addEventListener("click", m => m.stopPropagation());
        f.addEventListener("input", l);
        f.addEventListener("blur", SavedGroup.inputToSpan);
        f.addEventListener("keydown", escForBlur);
        a = createColorSpan(a.color);
        a.title = "";
        a.classList.add("pointer");
        a.addEventListener("click",
            SavedGroup.onColorClick);
        l = document.createElement("img");
        l.src = "img/background.jpg";
        l.className = "size-18 mx-1 align-text-bottom d-none";
        c.appendChild(a);
        c.appendChild(k);
        c.appendChild(f);
        c.appendChild(l);
        c.addEventListener("click", SavedGroup.openGroup);
        k = document.createElement("td");
        f = document.createElement("img");
        f.src = "img/background.jpg";
        f.className = "pointer size-24";
        f.addEventListener("click", SavedGroup.onMergeClick);
        k.appendChild(f);
        f = document.createElement("img");
        f.src = "img/background.jpg";
        f.className = "pointer size-24";
        f.addEventListener("click", SavedGroup.onCollapseClick);
        e.className = "expand";
        e.appendChild(f);
        h.addEventListener("click", SavedGroup.deleteGroup);
        g.appendChild(h);
        h = document.createElement("img");
        f = document.createElement("a");
        h.src = "img/background.jpg";
        h.className = "pointer size-24";
        f.href = "#";
        f.addEventListener("click", SavedGroup.showAdd);
        d.className = "dropdown dropstart";
        f.appendChild(h);
        d.appendChild(f);
        b.appendChild(c);
        b.appendChild(e);
        b.appendChild(d);
        b.appendChild(k);
        b.appendChild(g);
        return b
    }
    static spanToInput(a) {
        a.stopPropagation();
        this.classList.add("d-none");
        a = this.nextElementSibling;
        a.classList.remove("d-none");
        a.focus()
    }
    static inputToSpan(a) {
        a.stopPropagation();
        this.classList.add("d-none");
        a = this.previousElementSibling;
        a.textContent = this.value;
        a.classList.remove("d-none")
    }
    static onColorClick(a) {
        a.stopPropagation();
        a = this.parentElement;
        if ("DIV" == a.lastElementChild.tagName) a.lastElementChild.remove();
        else {
            var b = this.closest("tr").id,
                c = document.createElement("div");
            c.className = "mt-1";
            for (let d of Object.keys(ColorMap)) {
                let e = createColorSpan(d);
                e.title = "";
                e.classList.add("pointer");
                e.addEventListener("click", async g => {
                    g.stopPropagation();
                    await GroupStore.updateGroupColor(b, d) && showSuccessTip();
                    this.style.backgroundColor = ColorMap[d]
                });
                c.appendChild(e)
            }
            a.appendChild(c)
        }
    }
    static updateCollpaseAllBtn() {
        let a = SavedGroup.container.querySelectorAll('img[src="img/background.jpg"]').length,
            b = SavedGroup.container.querySelectorAll('img[src="img/background.jpg"]').length;
        SavedGroup.collapseAll.src = 0 == a + b || 0 < b ? "img/background.jpg" : "img/background.jpg"
    }
    static toggleCollpaseAll(a) {
        a = this.src.endsWith("img/background.jpg") ? SavedGroup.container.querySelectorAll('img[src="img/background.jpg"]') : SavedGroup.container.querySelectorAll('img[src="img/background.jpg"]');
        for (let b of a) b.click()
    }
    static onCollapseClick(a) {
        a.preventDefault();
        const b = this.closest("tr");
        a = b.firstElementChild;
        const c = a.firstElementChild;
        var d = c.nextElementSibling.nextElementSibling.nextElementSibling;
        "DIV" == a.lastElementChild.tagName && a.lastElementChild.remove();
        if (this.src.endsWith("img/background.jpg"))
            for (this.src = "img/background.jpg", c.classList.remove("group"), d.classList.add("d-none"), a = b.nextElementSibling; a && !a.id;) a.firstElementChild.firstElementChild.prepend(d.nextElementSibling), a.classList.remove("d-none"), a = a.nextElementSibling;
        else
            for (this.src = "img/background.jpg", c.classList.add("group"), d.classList.remove("d-none"), d = b.nextElementSibling; d && !d.id;) a.appendChild(d.firstElementChild.firstElementChild.firstElementChild),
                d.classList.add("d-none"), d = d.nextElementSibling;
        SavedGroup.updateCollpaseAllBtn()
    }
    static getOpenMode(a) {
        return isMacOS && a.metaKey || !isMacOS && a.ctrlKey ? "background" : a.shiftKey ? "newWindow" : "default"
    }
    static openTab(a, b) {
        a = SavedGroup.getOpenMode(a);
        "background" == a ? chrome.tabs.create({
            active: !1,
            url: b
        }) : "newWindow" == a ? chrome.windows.create({
            url: b
        }) : chrome.tabs.create({
            url: b
        })
    }
    static openGroup(a) {
        let b = this.closest("tr").id;
        chrome.runtime.sendMessage({
            type: "OpenGroup",
            id: b,
            mode: SavedGroup.getOpenMode(a)
        })
    }
    static async deleteTab(a) {
        a.preventDefault();
        a = this.closest("tr");
        if (a.id) GroupStore.delete(a.id), a.remove();
        else {
            var b = a.previousElementSibling,
                c = a.nextElementSibling;
            if (b.id && (c && c.id || !c)) GroupStore.delete(b.id), b.remove(), a.remove();
            else {
                b = a.firstElementChild.firstElementChild.title;
                c = a.previousElementSibling;
                let d = 0;
                for (; !c.id;) d++, c = c.previousElementSibling;
                await GroupStore.deleteTabInGroup(c.id, d, b) && a.remove()
            }
        }
        0 == SavedGroup.container.childElementCount && SavedGroup.setNoRecord()
    }
    static deleteGroup(a) {
        a.preventDefault();
        a = this.closest("tr");
        GroupStore.delete(a.id);
        let b = a.nextElementSibling;
        for (; b && !b.id;) b.remove(), b = a.nextElementSibling;
        a.remove();
        0 == SavedGroup.container.childElementCount && SavedGroup.setNoRecord()
    }
    static async deleteAll(a) {
        await GroupStore.deleteAll();
        SavedGroup.container.innerHTML = "";
        SavedGroup.setNoRecord();
        this.previousElementSibling.click()
    }
    static async importJson(a) {
        if (a = this.files[0])
            if (this.value = null, a.name.endsWith(".json") || "application/json" == a.type)
                if (5E6 < a.size) console.log("file size > 5MB");
                else try {
                    await GroupStore.importJson(a),
                        SavedGroup.refresh()
                } catch (b) {
                    console.log(b)
                } else console.log("file type is not json")
    }
    static async onMergeClick(a) {
        a.preventDefault();
        (a = this.closest("tr").querySelector("input").value) && await GroupStore.mergeGroup(a) && (SavedGroup.refresh(), showSuccessTip(chrome.i18n.getMessage("pT2MergeSuccess")))
    }
    static async onMergeAllClick(a) {
        a.preventDefault();
        await GroupStore.mergeAllGroups() && (SavedGroup.refresh(), showSuccessTip(chrome.i18n.getMessage("pT2MergeSuccess")))
    }
    static clearEditorInvalid() {
        SavedGroup.tabEditTitle.classList.remove("is-invalid");
        SavedGroup.tabEditUrl.classList.remove("is-invalid")
    }
    static showEdit(a, b) {
        SavedGroup.clearEditorInvalid();
        SavedGroup.editTarget = a;
        SavedGroup.tabEditTitle.value = b.title;
        SavedGroup.tabEditUrl.value = b.url;
        SavedGroup.tabEditor.show()
    }
    static async saveEdit(a) {
        a = SavedGroup.editTarget;
        var b = SavedGroup.tabEditTitle.value.trim();
        const c = SavedGroup.tabEditUrl.value.trim();
        b || SavedGroup.tabEditTitle.classList.add("is-invalid");
        c || SavedGroup.tabEditUrl.classList.add("is-invalid");
        if (b && c) {
            SavedGroup.clearEditorInvalid();
            if (a.id) {
                var d = await GroupStore.updateTab(a.id, b, c);
                d && (d = SavedGroup.createTab(d, !1), SavedGroup.container.replaceChild(d, a))
            } else {
                let e = a.previousElementSibling;
                for (d = 0; !e.id;) d++, e = e.previousElementSibling;
                if (b = await GroupStore.updateTabInGroup(e.id, d, b, c)) d = SavedGroup.createTab(b.tabs[d], b), SavedGroup.container.replaceChild(d, a)
            }
            SavedGroup.tabEditor.hide()
        }
    }
    static setupAddMenu() {
        let a = SavedGroup.dropdownAddMenu.lastElementChild,
            b = SavedGroup.dropdownAddMenu.firstElementChild,
            c = b.nextElementSibling;
        for (; c !== a;) c.remove(), c = b.nextElementSibling;
        chrome.tabs.query(QueryInWindow, function(d) {
            for (let e of d) {
                d = document.createElement("li");
                let g = document.createElement("label"),
                    h = document.createElement("input"),
                    k = document.createTextNode(e.title);
                g.className = "dropdown-item-text text-truncate";
                g.title = e.title;
                g.dataset.url = e.url;
                g.dataset.icon = e.favIconUrl;
                h.type = "checkbox";
                h.className = "me-1";
                g.appendChild(h);
                g.appendChild(k);
                d.appendChild(g);
                a.before(d)
            }
        })
    }
    static showAdd(a) {
        a.preventDefault();
        SavedGroup.dropdownAddMenu.dataset.targetId =
            this.closest("tr").id;
        this.nextElementSibling !== SavedGroup.dropdownAddMenu && this.parentElement.appendChild(SavedGroup.dropdownAddMenu);
        this.dataset.bsToggle || (this.dataset.bsToggle = "dropdown", this.addEventListener("show.bs.dropdown", SavedGroup.setupAddMenu), (new bootstrap.Dropdown(this, {
            autoClose: "outside",
            display: "static"
        })).show())
    }
    static async saveAdd(a) {
        a = SavedGroup.dropdownAddMenu.dataset.targetId;
        var b = SavedGroup.dropdownAddMenu.querySelectorAll("input:checked");
        let c = [];
        for (let d of b) b = d.parentElement,
            c.push({
                title: b.title ?? "",
                url: b.dataset.url,
                favIconUrl: b.dataset.icon
            });
        bootstrap.Dropdown.getInstance(SavedGroup.dropdownAddMenu.previousElementSibling).hide();
        0 < c.length && await GroupStore.addTabsInGroup(a, c) && SavedGroup.refresh()
    }
}
class RuleList {
    static async init() {
        document.getElementById("rule-edit").addEventListener("click", RuleList.openEditor);
        var a = await RuleStore.getRuleOptions(),
            b = document.getElementById("rule-scope");
        b.addEventListener("click", RuleList.updateRuleScope);
        b.checked = "all" === a["r-scope"];
        b = document.getElementById("rule-oneGroupInAll");
        b.addEventListener("click", RuleList.updateOneInAll);
        b.checked = a["r-oneGroupInAll"];
        b = document.getElementById("rule-groupByDomain");
        b.addEventListener("click", RuleList.updateGroupByDomain);
        b.checked = a["r-groupByDomain"];
        RuleList.container = document.getElementById("rules-list");
        a = await RuleStore.getAll();
        for (var c of a) RuleList.add(c);
        0 == a.length && (c = document.getElementById("no-rules").content.cloneNode(!0), initMsg(c), RuleList.container.appendChild(c))
    }
    static add(a) {
        let b = document.createElement("tr"),
            c = document.createElement("td"),
            d = document.createElement("span"),
            e = createColorSpan(a.groupColor);
        d.textContent = `${a.ruleName} (${a.groupName})`;
        c.appendChild(e);
        c.appendChild(d);
        (a.enabled ??
            !0) || (a = document.createElement("span"), a.className = "float-end text-muted", a.textContent = chrome.i18n.getMessage("pT3Disabled"), c.appendChild(a));
        b.appendChild(c);
        RuleList.container.appendChild(b)
    }
    static openEditor(a) {
        a.preventDefault();
        chrome.tabs.create({
            url: "rules.html"
        })
    }
    static updateRuleScope(a) {
        RuleStore.updateRuleScope(this.checked)
    }
    static updateOneInAll(a) {
        RuleStore.updateOneInAll(this.checked)
    }
    static updateGroupByDomain(a) {
        RuleStore.updateGroupByDomain(this.checked)
    }
}
class Shortcut {
    static init() {
        chrome.commands.getAll(function(a) {
            let b = document.getElementById("shortcuts-list");
            for (let c of a) b.appendChild(Shortcut.create(c))
        });
        document.getElementById("shortcut-edit").addEventListener("click", Shortcut.openEditor);
        document.querySelector("#kb-bug-tip a").addEventListener("click", Shortcut.openExtManager);
        Shortcut.tabTransitionEnd = !0;
        document.querySelectorAll("#nav-tabs button").forEach(function(a) {
            new bootstrap.Tab(a);
            a.addEventListener("shown.bs.tab", function(b) {
                Shortcut.tabTransitionEnd = !0
            })
        });
        document.addEventListener("keydown", Shortcut.keyboardListener)
    }
    static create(a) {
        let b = document.createElement("tr"),
            c = document.createElement("th");
        c.scope = "row";
        let d = document.createElement("td");
        d.textContent = a.description;
        var e = a.shortcut;
        if (e)
            for (a = e.split("+"), 2 > a.length && (a = e), e = 0; e < a.length; e++) {
                if (0 != e) {
                    var g = document.createTextNode(" + ");
                    c.appendChild(g)
                }
                g = document.createElement("kbd");
                g.textContent = a[e];
                c.appendChild(g)
            }
        b.appendChild(c);
        b.appendChild(d);
        return b
    }
    static openEditor(a) {
        a.preventDefault();
        a = chrome.i18n.getMessage("extName");
        a = "chrome://extensions/shortcuts#:~:text=" + encodeURIComponent(a);
        chrome.tabs.create({
            url: a
        })
    }
    static openExtManager(a) {
        a.preventDefault();
        chrome.tabs.create({
            url: "chrome://extensions/"
        })
    }
    static keyboardListener(a) {
        if ("INPUT" !== a.target.tagName) {
            var b = a.code,
                c = a.key;
            if (!(a.ctrlKey || a.altKey || a.metaKey) || "Enter" === c || "KeyO" === b)
                if ("ArrowRight" === b) a.preventDefault(), Shortcut.activeNextNavTab(!0);
                else if ("ArrowLeft" === b) a.preventDefault(), Shortcut.activeNextNavTab(!1);
            else if ("Backquote" === b) a.preventDefault(), a.shiftKey ? Shortcut.activeNextNavTab(!1) : Shortcut.activeNextNavTab(!0);
            else {
                var d = document.querySelector(".tab-pane.active.show"),
                    e, g;
                "current-tabs" === d.id ? e = d : "saved-groups" === d.id && (g = d);
                if (e || g)
                    if ("KeyJ" === b || "ArrowDown" === b) a.preventDefault(), Shortcut.activeNextRow(d, !0, a.shiftKey);
                    else if ("KeyK" === b || "ArrowUp" === b) a.preventDefault(), Shortcut.activeNextRow(d, !1, a.shiftKey);
                else {
                    var h = d.querySelector(".active-indicator");
                    if (h) {
                        const k = "DIV" === h.firstElementChild.tagName;
                        if ("Enter" === c || "KeyO" === b) {
                            a.preventDefault();
                            let f;
                            k ? f = h.firstElementChild : "Enter" === c ? f = h.nextElementSibling.firstElementChild : "KeyO" === b && g && (f = h);
                            f && (a = new MouseEvent("click", {
                                shiftKey: a.shiftKey,
                                metaKey: a.metaKey,
                                ctrlKey: a.ctrlKey
                            }), f.dispatchEvent(a))
                        } else("KeyC" === b || "KeyX" === b) && e || ("#" === c || "Delete" === b || "Backspace" === b) && g ? (a.preventDefault(), Shortcut.activeNextRow(d, !0, "DIV" !== h.firstElementChild.tagName), h.parentElement.lastElementChild.firstElementChild.click()) : "KeyS" === b && e ? (a.preventDefault(),
                            h.parentElement.lastElementChild.previousElementSibling.firstElementChild.click()) : "KeyR" === b && (a.preventDefault(), Shortcut.editGroupName(d))
                    }
                }
            }
        }
    }
    static activeNextNavTab(a) {
        var b = document.querySelector("#nav-tabs .nav-link.active");
        b && Shortcut.tabTransitionEnd && (b = b.parentElement, a = a ? b.nextElementSibling ? b.nextElementSibling : b.parentElement.firstElementChild : b.previousElementSibling ? b.previousElementSibling : b.parentElement.lastElementChild, Shortcut.tabTransitionEnd = !1, a = a.firstElementChild, a.focus(),
            bootstrap.Tab.getInstance(a).show())
    }
    static editGroupName(a) {
        (a = a.querySelector(".active-indicator span.group-name:not(.d-none)")) && a.click()
    }
    static activeNextRow(a, b, c = !1) {
        var d = a.querySelector(".active-indicator");
        if (d) {
            d = a = d.parentElement;
            do b ? (d = d.nextElementSibling, d || (d = a.parentElement.firstElementChild)) : (d = d.previousElementSibling, d || (d = a.parentElement.lastElementChild)); while (d.classList.contains("d-none") || c && d.firstElementChild.classList.contains("tab-in-group"));
            d !== a && (a.firstElementChild.classList.remove("active-indicator"),
                d.firstElementChild.classList.add("active-indicator"), d.scrollIntoViewIfNeeded(!0))
        } else(b = a.querySelector("tbody>tr:first-child")) && "pT2NoRecord" != b.firstElementChild.dataset.i18n && (b.firstElementChild.classList.add("active-indicator"), b.scrollIntoViewIfNeeded(!0))
    }
}

function initMsg(a = document) {
    a = a.querySelectorAll("[data-i18n]");
    for (const b of a) b.textContent = chrome.i18n.getMessage(b.dataset.i18n)
}

function initMsgHtml(a = document) {
    a = a.querySelectorAll("[data-i18n-html]");
    for (const b of a) b.innerHTML = chrome.i18n.getMessage(b.dataset.i18nHtml)
}

function init() {
    initMsg();
    initMsgHtml();
    Group.init();
    SavedGroup.init();
    RuleList.init();
    Shortcut.init();
    document.body.classList.remove("d-none")
}
init();