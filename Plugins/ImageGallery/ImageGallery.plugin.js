//META{"name":"ImageGallery","website":"https://github.com/ShasWHITE/BetterDiscordAddons-master/tree/master/BetterDiscordAddons-master/Plugins/ImageGallery","source":"https://raw.githubusercontent.com/mwittrien/BetterDiscordAddons/master/Plugins/ImageGallery/ImageGallery.plugin.js"}*//

class ImageGallery {
	getName () {return "ImageGallery";}

	getVersion () {return "1.6.1";}

	getAuthor () {return "ShasWHITE";}

	getDescription () {return "Allows the user to browse through images sent inside the same message.";}

	constructor () {
		this.changelog = {
			"fixed":[["Positioning & Overlapping","Preview images of previous and next image no longer overlap current image, this was caused by other plugins"]],
			"improved":[["New Library Structure & React","Restructured my Library and switched to React rendering instead of DOM manipulation"]]
		};

		this.patchedModules = {
			after: {
				ImageModal: ["render", "componentDidMount"]
			}
		};
	}

	initConstructor () {
		this.eventFired = false;

		this.css = `
			${BDFDB.dotCNS._imagegallerygallery + BDFDB.dotCN.imagewrapper + BDFDB.dotCN._imagegalleryprevious},
			${BDFDB.dotCNS._imagegallerygallery + BDFDB.dotCN.imagewrapper + BDFDB.dotCN._imagegallerynext} {
				position: fixed;
				z-index: -1;
			}
			${BDFDB.dotCNS._imagegallerygallery + BDFDB.dotCN.imagewrapper + BDFDB.dotCN._imagegalleryprevious} {
				right: 90%;
			} 
			${BDFDB.dotCNS._imagegallerygallery + BDFDB.dotCN.imagewrapper + BDFDB.dotCN._imagegallerynext} {
				left: 90%;
			}`;
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

			BDFDB.ModuleUtils.forceAllUpdates(this);
		}
		else console.error(`%c[${this.getName()}]%c`, "color: #3a71c1; font-weight: 700;", "", "Fatal Error: Could not load BD functions!");
	}

	stop () {
		if (global.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
			this.stopping = true;

			BDFDB.ModuleUtils.forceAllUpdates(this);

			BDFDB.PluginUtils.clear(this);
		}
	}


	// begin of own functions

	processImageModal (e) {
		let message = this.getMessageGroupOfImage(e.instance.props.src);
		if (message) {
			if (e.returnvalue) {
				let images = message.querySelectorAll(BDFDB.dotCNS.imagewrapper + "img");
				var next, previous;
				for (let i = 0; i < images.length; i++) if (this.getSrcOfImage(e.instance.props.src) == this.getSrcOfImage(images[i])) {
					next = 	this.getSrcOfImage(images[i+1]);
					previous = 	this.getSrcOfImage(images[i-1]);
					break;
				}
				if (next) {
					if (e.instance.nextRef) e.returnvalue.props.children.splice(1, 0, e.instance.nextRef);
					else this.loadImage(e.instance, this.getSrcOfImage(next), "next");
				}
				if (previous) {
					if (e.instance.previousRef) e.returnvalue.props.children.push(e.instance.previousRef);
					else this.loadImage(e.instance, this.getSrcOfImage(previous), "previous");
				}
			}
			if (e.node) {
				BDFDB.DOMUtils.addClass(BDFDB.DOMUtils.getParent(BDFDB.dotCN.modal, e.node), BDFDB.disCN._imagegallerygallery);
				this.cleanUpListeners();
				document.keydownImageGalleryListener = event => {
					if (!document.contains(e.node)) this.cleanUpListeners();
					else if (!this.eventFired) {
						this.eventFired = true;
						if (event.keyCode == 37) this.switchImages(e.instance, "previous");
						else if (event.keyCode == 39) this.switchImages(e.instance, "next");
					}
				};
				document.keyupImageGalleryListener = _ => {
					this.eventFired = false;
					if (!document.contains(e.node)) this.cleanUpListeners();
				};
				document.addEventListener("keydown", document.keydownImageGalleryListener);
				document.addEventListener("keyup", document.keyupImageGalleryListener);
			}
		}
	}

	getMessageGroupOfImage (src) {
		if (src) for (let group of document.querySelectorAll(BDFDB.dotCN.messagegroup)) for (let img of group.querySelectorAll(BDFDB.dotCNS.imagewrapper + "img")) if (img.src && this.getSrcOfImage(img) == this.getSrcOfImage(src)) return group;
		return null;
	}

	getSrcOfImage (img) {
		if (!img) return null;
		return (typeof img == "string" ? img : (img.src || (img.querySelector("canvas") ? img.querySelector("canvas").src : ""))).split("?width=")[0];
	}
	
	loadImage (instance, src, type) {
		let imagethrowaway = document.createElement("img");
		imagethrowaway.src = src;
		imagethrowaway.onload = _ => {
			var arects = BDFDB.DOMUtils.getRects(document.querySelector(BDFDB.dotCN.appmount));
			var resizeY = (arects.height/imagethrowaway.naturalHeight) * 0.65, resizeX = (arects.width/imagethrowaway.naturalWidth) * 0.8;
			var resize = resizeX < resizeY ? resizeX : resizeY;
			var newHeight = imagethrowaway.naturalHeight * resize;
			var newWidth = imagethrowaway.naturalWidth * resize;
			instance[type + "Ref"] = BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.LazyImage, {
				className: BDFDB.disCN[`_imagegallery${type}`],
				src: src,
				height: imagethrowaway.naturalHeight,
				width: imagethrowaway.naturalWidth,
				maxHeight: newHeight,
				maxWidth: newWidth,
				onClick: _ => {this.switchImages(instance, type);}
			});
			BDFDB.ReactUtils.forceUpdate(instance);
		};
	}
	
	switchImages (instance, type) {
		let imageRef = instance[type + "Ref"];
		if (!imageRef) return;
		delete instance.previousRef;
		delete instance.nextRef;
		instance.props.original = imageRef.props.src;
		instance.props.placeholder = imageRef.props.src;
		instance.props.src = imageRef.props.src;
		instance.props.height = imageRef.props.height;
		instance.props.width = imageRef.props.width;
		BDFDB.ReactUtils.forceUpdate(instance);
	}
	
	cleanUpListeners () {
		document.removeEventListener("keydown", document.keydownImageGalleryListener);
		document.removeEventListener("keyup", document.keyupImageGalleryListener);
		delete document.keydownImageGalleryListener;
		delete document.keyupImageGalleryListener;
	}
}
