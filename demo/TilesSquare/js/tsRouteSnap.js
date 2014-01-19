(function($) {
	var tsrsVersion = "0.0.1",
		poleIdx = 0,
		routePoles = [],
		transition = false,
		mode = "e",
        color = "r";

	$.widget("tlsq.routepole", $.tlsq.tsmarker, {
		options: {
			src: "TilesSquare/img/pole-r.png",
			title: "",
			width: 9,
			height: 54,
			marginTop: -51,
			marginLeft: -5,
			elev: 6
		},

		_create: function() {
			this._super("_create");

            var elem = this.element
                .draggable({
                	start: function(ev, ui) {
		            	$(this).routepole("start", ev, ui);
                	},
                	stop: function(ev, ui) {
		            	$(this).routepole("end", ev, ui);
                	},
                	drag: function(ev, ui) {
		            	$(this).routepole("move", ev, ui);
                	}
                });
		},

		start: function(ev, ui) {
            var elem = $(this.element),
            	pos = elem.position(),
				poleList = document.getElementsByName(this.options.plgid + "_poleList"),
            	trashElem = $("#" + this.options.plgid + "_trashImg");
            this.options.isLifted = true;
            elem.css("cursor", "all-scroll");
            poleIdx = elem.routepole("option", "pidx");
            poleList[poleIdx].checked = true;
            $(poleList[poleIdx]).button("refresh");
            trashElem.attr("src", "TilesSquare/img/trash-i.png")
		},

		end: function(ev, ui) {
            var elem = $(this.element),
            	trashElem = $("#" + this.options.plgid + "_trashImg"),
            	mapElem = $("#" + this.options.mapid),
				ts = mapElem.tsmap("option", "active"),
				offset = $("#" + ts.cvsid).offset(),
				exy = {
					elemX: ui.offset.left - offset.left,
					elemY: ui.offset.top - offset.top
				},
				trashPos = trashElem.position(),
				plgElem = $("#" + this.options.plgid);

            if(!this.options.isLifted) return;
            this.options.isLifted = false;
            elem.css("cursor", "default");

			if(trashPos.left + 10 < exy.elemX && exy.elemX < trashPos.left + trashElem.width() - 10
					&& trashPos.top < exy.elemY && exy.elemY < trashPos.top + trashElem.height() - 10) {
				// ゴミ箱の中
	            plgElem.tsroutesnap("removePole", poleIdx);
			}

            plgElem.tsroutesnap("updatePoleList");
            trashElem.attr("src", "TilesSquare/img/trash-o.png");
            plgElem.tsroutesnap("onChangeData", ts, routePoles, color);
		},

		move: function(ev, ui) {
    		var mapElem = $("#" + this.options.mapid),
				ts = mapElem.tsmap("option", "active"),
				offset = $("#" + ts.cvsid).offset(),
				exy = {
					elemX: ui.offset.left - offset.left,
					elemY: ui.offset.top - offset.top
				},
				dexy = {
					deltaElemX: exy.elemX - (ts.width >> 1),
					deltaElemY: exy.elemY - (ts.height >> 1)
				},
				lonlat = ts.deltaElem2LonLat(dexy);

			routePoles[poleIdx].lon = lonlat.lon;
			routePoles[poleIdx].lat = lonlat.lat;
			ts.draw();
		}
	});

	$.widget("tlsq.tsroutesnap", {
		options: {
			version: tsrsVersion,
			width: 800,
			height: 500,
            lon: 139.6916667,
            lat: 35.6894444,
            zoom: 12,
            poleNewCol: 10,
            onChangeData: undefined
		},

		_create: function() {
			// 全体
            var elem = this.element
                .css("position", "relative")
//                .css("border", "solid 1px red")
                .css("left", "0px")
                .css("top", "0px")
                .css("width", this.options.width + "px")
                .css("height", this.options.height + "px");

			// マップ
            var mapid = elem.attr("id") + "_mapContainer",
            	mapElem = $("<div />")
	            	.attr("id", mapid)
	                .css("position", "absolute")
	                .css("left", "0px")
	                .css("top", "0px");
            elem.append(mapElem);
            this.options.mapid = mapid;
			mapElem.tsmap({
				width: this.options.width,
				height: this.options.height,
				tss: [
					new OSMTilesSquare()
//					new MapQuestOSMTilesSquare()
				],
	            lon: this.options.lon,
	            lat: this.options.lat,
				zoom: this.options.zoom,
				onCreate: function(mapid, ovlsid, popsid) {
					mapElem.tsmap("select", "default");
				},
				onActivate: function(ts) {
					$("#" + ts.ovlsid).tsoverlays("mergeOverlays", routePoles);
				},
				onPointerSingle: function(ts, exy, lonlat) {
					if(mode != "e") return false;

					var routePole = {
							plgid: elem.attr("id"),
							mapid: mapid,
							pidx: poleIdx,
							title: "" + (poleIdx + 1),
							src: "TilesSquare/img/pole-" + color + ".png",
							lon: lonlat.lon,
							lat: lonlat.lat
						};
					routePoles.splice(poleIdx, 0, routePole);

					for(var pidx = poleIdx + 1; pidx < routePoles.length; pidx++) {
						routePoles[pidx].pidx = pidx;
						routePoles[pidx].title = "" + (pidx + 1);
					}
					poleIdx++;

					elem.tsroutesnap("updatePoleList");
					ts.draw();
		        	elem.tsroutesnap("onChangeData", ts, routePoles, color);
					return true;
				},
				drawLine: function(ts) {
					var canvas = document.getElementById(ts.cvsid);
					if(!canvas.getContext) return;
					var ctxt = canvas.getContext("2d");
					ctxt.lineWidth = 7;
					ctxt.lineJoin = "round";
					switch(color) {
					case "y":
						ctxt.strokeStyle = "rgba(255, 247, 119, 0.6)";
						break;
					case "b":
						ctxt.strokeStyle = "rgba(119, 231, 255, 0.6)";
						break;
					default:
						ctxt.strokeStyle = "rgba(240, 119, 255, 0.6)";
						break;
					}

					ctxt.beginPath();
					for(var pidx = 0; pidx < routePoles.length; pidx++) {
				        var dexy = ts.lonLat2DeltaElem({
				            lon: routePoles[pidx].lon,
				            lat: routePoles[pidx].lat
				        }),
				        ex = (ts.width >> 1) + dexy.deltaElemX,
						ey = (ts.height >> 1) + dexy.deltaElemY;

						if(pidx) {
							ctxt.lineTo(ex, ey);
						} else {
							ctxt.moveTo(ex, ey);
						}
					}
					ctxt.stroke();
				},
		        beforeMove: function(ts, req) {
		        	transition = true;
		        },
		        afterMove: function(ts, req, dexy) {
		        	transition = false;
					mapElem.tsmap("option", "drawLine")(ts);
		        	elem.tsroutesnap("onChangeData", ts, routePoles, color);
		        },
		        beforeZoom: function(ts, req) {
		        	transition = true;
		        },
		        afterZoom: function(ts, req, dexy) {
		        	transition = false;
					mapElem.tsmap("option", "drawLine")(ts);
		        	elem.tsroutesnap("onChangeData", ts, routePoles, color);
		        },
		        afterDrag: function(ts, req) {
		        	elem.tsroutesnap("onChangeData", ts, routePoles, color);
		        },
				onDraw: function(ts) {
					if(transition) return;
					mapElem.tsmap("option", "drawLine")(ts);
				}
			});

			// モード
            var mdid = elem.attr("id") + "_modeDiv",
            	mdElem = $("<div />")
	            	.attr("id", mdid)
	                .css("position", "absolute")
	                .css("top", "15px")
	                .css("right", "15px"),
	            editBtnElem = $("<input />")
	            	.attr("id", elem.attr("id") + "_editBtn")
	            	.attr("type", "radio")
	            	.attr("name", elem.attr("id") + "_mode")
	            	.attr("checked", "checked")
	            	.click(function() {
	            		var ts = mapElem.tsmap("option", "active");
	            		ts.draw();
	            		$("#" + ts.ovlsid).css("visibility", "visible");
	            		$("#" + clrid).css("visibility", "visible");
	            		$("#" + plstid).css("visibility", "visible");
	            		$("#" + trsid).css("visibility", "visible");
	            		mode = "e";
					}),
	            editLblElem = $("<label />")
	            	.attr("for", elem.attr("id") + "_editBtn")
	                .css("font-size", "14px")
	            	.text("編集"),
	            viewBtnElem = $("<input />")
	            	.attr("id", elem.attr("id") + "_viewBtn")
	            	.attr("type", "radio")
	            	.attr("name", elem.attr("id") + "_mode")
	            	.click(function() {
	            		var ts = mapElem.tsmap("option", "active");
	            		ts.draw();
	            		$("#" + ts.ovlsid).css("visibility", "hidden");
	            		$("#" + clrid).css("visibility", "hidden");
	            		$("#" + plstid).css("visibility", "hidden");
	            		$("#" + trsid).css("visibility", "hidden");
	            		mode = "v";
					}),
	            viewLblElem = $("<label />")
	            	.attr("for", elem.attr("id") + "_viewBtn")
	                .css("font-size", "14px")
	            	.text("閲覧");
			mdElem.append(editBtnElem);
			mdElem.append(editLblElem);
			mdElem.append(viewBtnElem);
			mdElem.append(viewLblElem);
            mapElem.append(mdElem);
            this.options.mdid = mdid;
            mdElem.buttonset();

			// 色
            var clrid = elem.attr("id") + "_colorDiv",
            	clrName = elem.attr("id") + "_color",
            	clrElem = $("<div />")
	            	.attr("id", clrid)
	                .css("position", "absolute")
	                .css("top", "60px")
	                .css("right", "15px"),
	            redBtnElem = $("<input />")
	            	.attr("id", elem.attr("id") + "_redBtn")
	            	.attr("type", "radio")
	            	.attr("name", clrName)
	            	.attr("value", "r")
	            	.attr("checked", "checked")
	            	.click(function() {
	            		elem.tsroutesnap("changeColor", "r");
					}),
	            redLblElem = $("<label />")
	            	.attr("for", elem.attr("id") + "_redBtn")
	                .css("color", "#f8b")
	                .css("font-size", "14px")
	            	.text("赤"),
	            yellowBtnElem = $("<input />")
	            	.attr("id", elem.attr("id") + "_yellowBtn")
	            	.attr("type", "radio")
	            	.attr("name", clrName)
	            	.attr("value", "y")
	            	.click(function() {
	            		elem.tsroutesnap("changeColor", "y");
					}),
	            yellowLblElem = $("<label />")
	            	.attr("for", elem.attr("id") + "_yellowBtn")
	                .css("color", "#ff8")
	                .css("font-size", "14px")
	            	.text("黄"),
	            blueBtnElem = $("<input />")
	            	.attr("id", elem.attr("id") + "_blueBtn")
	            	.attr("type", "radio")
	            	.attr("name", clrName)
	            	.attr("value", "b")
	            	.click(function() {
	            		elem.tsroutesnap("changeColor", "b");
					}),
	            blueLblElem = $("<label />")
	            	.attr("for", elem.attr("id") + "_blueBtn")
	                .css("color", "#9af")
	                .css("font-size", "14px")
	            	.text("青");
			clrElem.append(redBtnElem);
			clrElem.append(redLblElem);
			clrElem.append(yellowBtnElem);
			clrElem.append(yellowLblElem);
			clrElem.append(blueBtnElem);
			clrElem.append(blueLblElem);
            mapElem.append(clrElem);
            this.options.clrid = clrid;
            this.options.clrName = clrName;
            clrElem.buttonset();

			// ポール一覧
            var plstid = elem.attr("id") + "_poleListDiv",
            	plstElem = $("<div />")
	            	.attr("id", plstid)
	                .css("position", "absolute")
	                .css("width", "1px")
	                .css("height", "1px")
	                .css("top", "0px")
	                .css("right", "0px");
            mapElem.append(plstElem);
            this.options.plstid = plstid;
            this.updatePoleList();

			// ゴミ箱
            var trsid = elem.attr("id") + "_trashImg",
            	kmlPos = $("#" + mapid + "_scale_kmLabel").position(),
            	trsElem = $("<img />")
	            	.attr("id", trsid)
	            	.attr("src", "TilesSquare/img/trash-o.png")
	            	.attr("alt", "trash")
	                .css("position", "absolute")
	                .css("width", "95px")
	                .css("height", "100px")
	                .css("top", (kmlPos.top - 120) + "px")
	                .css("left", "10px");
            mapElem.append(trsElem);
            this.options.trsid = trsid;
		},

		_setOption: function(key, value) {
			switch(key) {
			case "clear":
				// handle changes to clear option
				break;
			}

			this._super(key, value);
		},

		_destroy: function() {
		},

		changeColor: function(color2) {
			var mapElem = $("#" + this.options.mapid),
    			ts = mapElem.tsmap("option", "active");
    		color = color2;

			for(var pidx = 0; pidx < routePoles.length; pidx++) {
				routePoles[pidx].src = "TilesSquare/img/pole-" + color + ".png";
			}
			mapElem.tsmap("option", "drawLine")(ts);
			$("#" + ts.ovlsid).children().each(function() {
				$(this).routepole("option", "src", "TilesSquare/img/pole-" + color + ".png");
				$(this).children().attr("src", "TilesSquare/img/pole-" + color + ".png");
			});

    		ts.draw();
			$(this.element).tsroutesnap("onChangeData", ts, routePoles, color);
		},

		removePole: function(pidx) {
	        var mapElem = $("#" + this.options.mapid),
    			ts = mapElem.tsmap("option", "active");
			routePoles.splice(poleIdx, 1);

			for(var pidx = poleIdx; pidx < routePoles.length; pidx++) {
				routePoles[pidx].pidx = pidx;
				routePoles[pidx].title = "" + (pidx + 1);
			}

			$(this.element).tsroutesnap("updatePoleList");
			ts.draw();
			$(this.element).tsroutesnap("onChangeData", ts, routePoles, color);
		},

		updatePoleList: function() {
	        var mapElem = $("#" + this.options.mapid),
    			ts = mapElem.tsmap("option", "active"),
    			plstElem = $("#" + this.options.plstid).empty(),
				ovlsElem = $("#" + ts.ovlsid),
				routePoleElems = [];
			ovlsElem.tsoverlays("removeOverlays");

			for(var pidx = 0; pidx <= routePoles.length; pidx++) {
				var pid0 = "p0000" + (pidx + 1), pid = pid0.substr(pid0.length - 6, 6);

				var btnElem = $("<input />")
	        	    	.attr("id", this.element.attr("id") + "_" + pid + "Btn")
		            	.attr("type", "radio")
		            	.attr("name", this.element.attr("id") + "_poleList")
		            	.data("pidx", pidx)
		            	.click(function() {
		            		poleIdx = $(this).data("pidx");
						}),
		            lblElem = $("<label />")
	        	    	.attr("for", this.element.attr("id") + "_" + pid + "Btn")
		                .css("font-size", "12px")
		                .css("width", "40px")
		                .css("height", "28px")
		                .css("position", "absolute")
		                .css("top", (120 + (pidx % this.options.poleNewCol) * 32) + "px")
		                .css("right", (15 + (~~(routePoles.length / this.options.poleNewCol) - ~~(pidx / this.options.poleNewCol)) * 45) + "px")
		            	.text(pidx == routePoles.length ? "★" : pidx + 1);
		        if(pidx == poleIdx) {
		        	btnElem.attr("checked", "checked");
		        }
				plstElem.append(btnElem);
				plstElem.append(lblElem);
				btnElem.button();

				if(pidx < routePoles.length) {
					routePoleElems.push($("<a />").routepole(routePoles[pidx]));
				}
			}
			ovlsElem.tsoverlays("mergeOverlays", routePoleElems)
				.tsoverlays("plot", ts, true);
		},

		onChangeData: function(ts, toutePoles, color) {
			var func = $(this.element).tsroutesnap("option", "onChangeData");
			if(func) func(ts, toutePoles, color);
		},

		buildCSVText: function(ts, toutePoles, color) {
			var csvText = "tsRouteSnap,";
			csvText += $(this.element).tsroutesnap("option", "version");

			var now = new Date(),
				mon = now.getMonth() + 1,
				day = now.getDate(),
				hour = now.getHours(),
				min = now.getMinutes(),
				sec = now.getSeconds(),
				time14 = now.getFullYear();
			time14 += (mon < 10 ? "0" : "") + mon;
			time14 += (day < 10 ? "0" : "") + day;
			time14 += (hour < 10 ? "0" : "") + hour;
			time14 += (min < 10 ? "0" : "") + min;
			time14 += (sec < 10 ? "0" : "") + sec;
			csvText += "," + time14;

			csvText += "," + ts.options.zoom;
			csvText += "," + Math.round(ts.options.lon * 10000000) / 10000000;
			csvText += "," + Math.round(ts.options.lat * 10000000) / 10000000;
			csvText += "," + color;

			for(var pidx = 0; pidx < routePoles.length; pidx++) {
				csvText += "," + Math.round(routePoles[pidx].lon * 10000000) / 10000000;
				csvText += "," + Math.round(routePoles[pidx].lat * 10000000) / 10000000;
			}

			return csvText
		},

		loadCSVText: function(csvText) {
			var plgid = $(this.element).attr("id"),
				mapElem = $("#" + this.options.mapid),
    			ts = mapElem.tsmap("option", "active"),
    			clrBtns = document.getElementsByName(this.options.clrName),
				vals = csvText.split(","),
				vidx = 3
				zoom = ~~vals[vidx++],
				lon = +vals[vidx++],
				lat = +vals[vidx++];

			$("#" + ts.ovlsid).tsoverlays("removeOverlays");

			color = vals[vidx++];
			for(var bidx = 0; bidx < clrBtns.length; bidx++) {
				clrBtns[bidx].checked = (clrBtns[bidx].value == color);
			}
			$("#" + this.options.clrid).buttonset("refresh");

			routePoles = [];
			poleIdx = 0;
			var pmax = vals.length - vidx;
			for(var pidx = 0; pidx < pmax; pidx += 2) {
				var routePole = {
						plgid: plgid,
						mapid: this.options.mapid,
						pidx: pidx,
						title: "" + (pidx + 1),
						src: "TilesSquare/img/pole-" + color + ".png",
						lon: +vals[vidx + pidx],
						lat: +vals[vidx + pidx + 1]
					};
				routePoles.push(routePole);
			}

		    // 中心が変わったときの再描画要求に相当
		    // TODO: setCenterして移動量0のonMoveするとlonLat2DeltaElemの必要がないけど、
		    //  onZoomやonMove側でelemXY以外も受け入れるようにするべきか。
		    var deltaZ = zoom - ts.options.zoom,
			    dexy = ts.lonLat2DeltaElem({
		            lon: lon,
		            lat: lat
		        });
		    if(deltaZ) {
		        ts.onZoom({
		            zoom: zoom,
	                elemX: (ts.width >> 1) + dexy.deltaElemX,
	                elemY: (ts.height >> 1) + dexy.deltaElemY
		        });
		    } else {
			    ts.onMove({
	                elemX: (ts.width >> 1) + dexy.deltaElemX,
	                elemY: (ts.height >> 1) + dexy.deltaElemY
	            })
		    }

			$(this.element).tsroutesnap("updatePoleList");
		},

		reset: function() {
			var mapElem = $("#" + this.options.mapid),
    			ts = mapElem.tsmap("option", "active"),
    			clrBtns = document.getElementsByName(this.options.clrName);

			routePoles = [];
			poleIdx = 0;
			$("#" + ts.ovlsid).tsoverlays("removeOverlays");

			color = "r";
			for(var bidx = 0; bidx < clrBtns.length; bidx++) {
				clrBtns[bidx].checked = (clrBtns[bidx].value == color);
			}
			$("#" + this.options.clrid).buttonset("refresh");

			$(this.element).tsroutesnap("updatePoleList");
			ts.draw();
		}
	});

}(jQuery));

