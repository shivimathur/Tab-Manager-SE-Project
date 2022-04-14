class GroupStore {
    static saveGroup(a, c) {
        return new Promise(function(b, d) {
            d = c.map(h => ({
                title: h.title,
                url: h.url,
                favIconUrl: h.favIconUrl
            }));
            const g = Date.now(),
                f = `group-${g.toString(36)}`,
                e = a.title ?? "",
                k = {};
            k[f] = {
                id: f,
                type: "group",
                createTime: g,
                title: e,
                color: a.color,
                tabs: d
            };
            chrome.storage.local.set(k, function() {
                e ? chrome.storage.local.get(null, async function(h) {
                    let l = [];
                    for (let m of Object.values(h)) "group" === m.type && m.title === e && l.push(m);
                    l.sort((m, n) => n.createTime - m.createTime);
                    for (h = 0; h < l.length; h++) h >= SavedGroup.maxSnapshots && await GroupStore.delete(l[h].id);
                    b()
                }) : b()
            })
        })
    }

    static saveTab(a) {
        return new Promise(function(c,
            b) {
            b = Date.now();
            const d = `tab-${b.toString(36)}`,
                g = a.url,
                f = {};
            f[d] = {
                id: d,
                type: "tab",
                createTime: b,
                title: a.title ?? "",
                url: g,
                favIconUrl: a.favIconUrl
            };
            chrome.storage.local.set(f, function() {
                chrome.storage.local.get(null, async function(e) {
                    let k = [];
                    for (let h of Object.values(e)) "tab" === h.type && h.url === g && k.push(h);
                    k.sort((h, l) => l.createTime - h.createTime);
                    for (e = 0; e < k.length; e++) 1 <= e && await GroupStore.delete(k[e].id);
                    c()
                })
            })
        })
    }

    static addTabsInGroup(a, c) {
        return new Promise(function(b, d) {
            chrome.storage.local.get(a, function(g) {
                let f = g[a];
                f && f.tabs ? (f.tabs = f.tabs.concat(c), chrome.storage.local.set(g, function() {
                    b(!0)
                })) : b(!1)
            })
        })
    }
    static delete(a) {
        return new Promise(function(c, b) {
            chrome.storage.local.remove(a, c)
        })
    }
    static updateGroup(a, c, b) {
        return new Promise(function(d, g) {
            a.startsWith("group-") ?
                chrome.storage.local.get(a, function(f) {
                    let e = f[a];
                    e ? (e[c] = b, chrome.storage.local.set(f, function() {
                        d(!0)
                    })) : d(!1)
                }) : d(!1)
        })
    }
    static importJson(a) {
        return new Promise(async function(c, b) {
            let d;
            try {
                d = JSON.parse(await a.text())
            } catch (f) {
                b("JSON parse failed");
                return
            }
            if ("tab-groups" == d.meta?.name && 1 <= d.meta?.version) {
                delete d.meta;
                var g = {};
                for (const [f, e] of Object.entries(d)) {
                    if ("group" === e.type) {
                        if (!e.tabs || !e.color) continue
                    } else if ("tab" === e.type) {
                        if (!e.url) continue
                    } else continue;
                    g[f] = e
                }
                chrome.storage.local.set(g,
                    function() {
                        chrome.runtime.lastError ? b("storage save failed") : c()
                    })
            } else b("metadata validation failed")
        })
    }
    static exportJson() {
        chrome.storage.local.get(null, function(a) {
            a.meta = {
                name: "tab-groups",
                version: 1
            };
            a = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(a));
            GroupStore.downloadFile(a, "json")
        })
    }
    static async exportHtml() {
        var a = await GroupStore.getAll();
        const c = ["<ul>"];
        for (let b of a)
            if ("group" === b.type) {
                c.push(`<li>\u25BC ${b.title?b.title:"No Name Group"}<ul>`);
                for (let d of b.tabs) c.push(GroupStore.generateLi(d.url,
                    d.title));
                c.push("</ul></li>")
            } else "tab" === b.type && c.push(GroupStore.generateLi(b.url, b.title));
        c.push("</ul>");
        a = `<!DOCTYPE html><html><head><meta charset="utf-8"><title></title><style>li{line-height:1.5;font-family:system-ui;} body>ul{list-style: none;}</style></head><body>${c.join("")}</body></html>`;
        a = "data:text/html;charset=utf-8," + encodeURIComponent(a);
        GroupStore.downloadFile(a, "html")
    }
};