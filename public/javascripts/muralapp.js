Ext.setup({
	tabletStartupScreen: 'tablet_startup.png',
	phoneStartupScreen: 'phone_startup.png',
	icon: 'icon.png',
	glossOnIcon: false,
	onReady: function() {
		var panel, listing, mapPanel, markers = [];
		
		function getCoorInPhilly () {
			var allCoords = [];
			// City Hall
			allCoords.push({
				latitude: 39.95185892663003,
				longitude: -75.16382217407227
			});
			
			// Center City East
			allCoords.push({
				latitude: 39.94955601195755,
				longitude: -75.15103340148926
			});
			
			// Temple
			allCoords.push({
				latitude: 39.98027708862263,
				longitude: -75.15541076660156
			});
			
			// Passyunk Square
			allCoords.push({
				latitude: 39.93349925254218,
				longitude: -75.16433715820312
			});
			
			// Girard & 2nd
			allCoords.push({
				latitude: 39.969819000030895,
				longitude: -75.13936042785645
			});
			console.log(allCoords);
			var randomNumber = parseInt(Math.random() * allCoords.length);
			console.log(randomNumber);
			return allCoords[randomNumber];
			
		}
		
		function dirtyXML2JsonConversion(node) {
			var coords = node.getElementsByTagNameNS('http://www.georss.org/georss/','point');

			if(coords.length && coords.textContent != '') {
				coords = coords[0].textContent.split(' ');
			}
//console.log(coords);

			var mural = {
				'title': node.getElementsByTagName('title')[0].textContent,
				'description': node.getElementsByTagName('description')[0].textContent,
				'link': node.getElementsByTagName('link')[0].textContent,
				'pubDate': node.getElementsByTagName('pubDate')[0].textContent,
				'coordinates': coords
			}
//console.log(mural);
//console.log(arr);
			return mural; 
		}
		
		listing = new Ext.Component({
			title: "Listing",
			scroll: 'vertical',
			tpl: [
			  '<tpl for=".">',
			  '	<div class="tweet">',
			  '		<div class="avatar"><img src="{profile_image_url}" /></div>',
			  '		<div class="tweet-content">',
			  '			<h2>{from_user}</h2>',
			  '			<p>{text}</p>',
			  '		</div>',
			  '	</div>',
			  '</tpl>'
			]
		});
		
		mapPanel = new Ext.Map({
			title: "Map",
			useCurrentLocation: true
		});
		
		panel = new Ext.TabPanel({
			fullscreen: true,
			cardSwitchAnimation: 'slide',
			ui: 'light',
			items: [mapPanel, listing]
		});
		
		addMarker = function(mural) {
			var latLng = new google.maps.LatLng(mural.coordinates[0], mural.coordinates[1]);

			var marker = new google.maps.Marker({
				map: mapPanel.map,
				position: latLng
			});
			
			markers.push(marker);

			google.maps.event.addListener(marker, "click", function() {
				tweetBubble.setContent(mural.title);
				tweetBubble.open(mapPanel.map, marker);
			});
		};
		
		clearMarkers = function() {
			for(var i=0; i < markers.length; i++) {
				markers[i].setMap(null);
			}
			markers = [];
		}
		tweetBubble = new google.maps.InfoWindow();
		
		refresh = function() {
			// Un comment the line below to actually use the GPS on the phone;
			//var coords = mapPanel.geo.coords;
			// Get a random coordinate in Philly
			var coords = getCoorInPhilly();
			
//console.log(coords);
			var testMap = mapPanel;
//console.log(testMap);
			
			// Figure out the bounding box for the query
			var f = 0.015;
			bbox = {'minx': (coords.longitude-f),
					'miny': (coords.latitude-f),
					'maxx': (coords.longitude+f),
					'maxy': (coords.latitude+f)
					};
//console.log(bbox);
			
			// Change the projection
			// creating source and destination Proj4js objects
			var source = new Proj4js.Proj('WGS84');    //source coordinates will be in Longitude/Latitude
			var dest = new Proj4js.Proj('EPSG:900913');     //destination coordinates in Google Mercator

			// transforming point coordinates
			var nw = new Proj4js.Point(bbox.minx,bbox.maxy); 
			Proj4js.transform(source, dest, nw);     
			
			// transforming point coordinates
			var se = new Proj4js.Point(bbox.maxx,bbox.miny);
			Proj4js.transform(source, dest, se); 
			
//console.log(nw);
//console.log(se);
			
			// Ask for the mural data from muralfarm.org (via our proxy php script)
			Ext.Ajax.request({
				url: 'pr0xy.php?type=area&minx='+nw.x+'&miny='+se.y+'&maxx='+se.x+'&maxy='+nw.y,
				success: function(data, opts) {
//console.log(data);
					
					xml = data.responseXML;
					
//console.log(murals);					
					
//console.log(xml);
					var murals = Ext.DomQuery.select("channel item", xml);
//console.log(murals);
console.log(murals.length);
					
					
					//var tweetList = data.results;
					//listing.update(tweetList);
					
					clearMarkers();
					
					// Add points to the map
					for(var i=0, ln = murals.length; i < ln; i++){
						var mural = dirtyXML2JsonConversion(murals[i]);
						
console.log(mural);
						if(mural && mural.coordinates) {
							addMarker(mural);
						}
//console.log(point);
						/*
						if(tweet.geo && tweet.geo.coordinates) {
							addMarker(tweet);
						}
						*/
					}
					
					
				},
				failure: function(response, opts) {
					console.log('server-side failure with status code ' + response.status);
				}
			})	
					
		}
		
		panel.getTabBar().add([
			{ xtype: 'spacer'},
			{
				xtype: 'button',
				iconMask: true,
				iconCls: 'refresh',
				ui: 'plain',
				style: 'margin:0;',
				handler: refresh
			}
		]);
		
		panel.getTabBar().doLayout();
		
		mapPanel.geo.on('update', refresh);
	}
});