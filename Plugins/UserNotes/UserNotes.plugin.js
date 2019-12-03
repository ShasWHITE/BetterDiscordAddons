﻿//META{"name":"UserNotes","website":"https://github.com/ShasWHITE/BetterDiscordAddons-master/tree/master/BetterDiscordAddons-master/Plugins/UserNotes","source":"https://raw.githubusercontent.com/mwittrien/BetterDiscordAddons/master/Plugins/UserNotes/UserNotes.plugin.js"}*//

class UserNotes {
	getName () {return "UserNotes";}

	getVersion () {return "1.0.4";}

	getAuthor () {return "ShasWHITE";}

	getDescription () {return "Allows you to write your own user notes wihtout a character limit.";}
	
	constructor () {
		this.changelog = {
			"improved":[["New Library Structure & React","Restructured my Library and switched to React rendering instead of DOM manipulation"]]
		};
	}
	
	initConstructor () {
		this.css = `
			.${this.name}-modal textarea {
				height: 50vh;
			}`;
	}

	getSettingsPanel () {
		if (!global.BDFDB || typeof BDFDB != "object" || !BDFDB.loaded || !this.started) return;
		let settingsitems = [];
		
		settingsitems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
			type: "Button",
			className: BDFDB.disCN.marginbottom8,
			color: BDFDB.LibraryComponents.Button.Colors.RED,
			label: "Delete all Usernotes",
			onClick: _ => {
				BDFDB.ModalUtils.confirm(this, "Are you sure you want to remove all usernotes?", () => {
					BDFDB.DataUtils.remove(this, "notes");
				});
			},
			children: BDFDB.LanguageUtils.LanguageStrings.DELETE
		}));
		
		return BDFDB.PluginUtils.createSettingsPanel(this, settingsitems);
	}

	//legacy
	load () {}

	start () {
		if (!global.BDFDB) global.BDFDB = {myPlugins:{}};
		if (global.BDFDB && global.BDFDB.myPlugins && typeof global.BDFDB.myPlugins == "object") global.BDFDB.myPlugins[this.getName()] = this;
		var libraryScript = document.querySelector('head script#BDFDBLibraryScript');
		if (!libraryScript || (performance.now() - libraryScript.getAttribute("date")) > 600000) {
			if (libraryScript) libraryScript.remove();
			libraryScript = document.createElement("script");
			libraryScript.setAttribute("id", "BDFDBLibraryScript");
			libraryScript.setAttribute("type", "text/javascript");
			libraryScript.setAttribute("src", "https://ShasWHITE.github.io/BetterDiscordAddons/Plugins/BDFDB.min.js");
			libraryScript.setAttribute("date", performance.now());
			libraryScript.addEventListener("load", () => {this.initialize();});
			document.head.appendChild(libraryScript);
		}
		else if (global.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) this.initialize();
		this.startTimeout = setTimeout(() => {
			try {return this.initialize();}
			catch (err) {console.error(`%c[${this.getName()}]%c`, "color: #3a71c1; font-weight: 700;", "", "Fatal Error: Could not initiate plugin! " + err);}
		}, 30000);
	}

	initialize () {
		if (global.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
			if (this.started) return;
			BDFDB.PluginUtils.init(this);
		}
		else console.error(`%c[${this.getName()}]%c`, "color: #3a71c1; font-weight: 700;", "", "Fatal Error: Could not load BD functions!");
	}


	stop () {
		if (global.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
			this.stopping = true;

			BDFDB.PluginUtils.clear(this);
		}
	}


	// begin of own functions

	onUserContextMenu (e) {
		if (e.instance.props.user) {
			let [children, index] = BDFDB.ReactUtils.findChildren(e.returnvalue, {name:["FluxContainer(MessageDeveloperModeGroup)", "DeveloperModeGroup"]});
			const itemgroup = BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ContextMenuItemGroup, {
				children: [
					BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ContextMenuItem, {
						label: BDFDB.LanguageUtils.LanguageStrings.USERS + " " + BDFDB.LanguageUtils.LanguageStrings.NOTE,
						action: _ => {
							BDFDB.ContextMenuUtils.close(e.instance);
							this.openNotesModal(e.instance.props.user);
						}
					})
				]
			});
			if (index > -1) children.splice(index, 0, itemgroup);
			else children.push(itemgroup);
		}
	}

	openNotesModal (user) {
		let note = BDFDB.DataUtils.load(this, "notes", user.id);
		
		BDFDB.ModalUtils.open(this, {
			size: "LARGE",
			header: BDFDB.LanguageUtils.LanguageStrings.USERS + " " + BDFDB.LanguageUtils.LanguageStrings.NOTE,
			subheader: user.username,
			scroller: false,
			children: [
				BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextArea, {
					value: note,
					placeholder: note,
					autoFocus: true
				})
			],
			buttons: [{
				contents: BDFDB.LanguageUtils.LanguageStrings.SAVE,
				color: "BRAND",
				close: true,
				click: modal => {
					note = modal.querySelector("textarea").value;
					if (note) BDFDB.DataUtils.save(note, this, "notes", user.id);
					else BDFDB.DataUtils.remove(this, "notes", user.id);
				}
			}]
		});
	}
}
