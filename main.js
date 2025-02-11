//I am ashamed. Please don't read this code.

const BIG_CITY_POPULATION = 100000
const MEDIUM_CITY_POPULATION = 20000
const INITIAL_STATE = {
	spain: [],
	madrid: [],
	murcia: [],
	cadiz: []
};

var state = INITIAL_STATE;
var provincia;
var sortingStrategy;

window.onload = (event) => {
	loadPage();
}

function loadPage() {
	var municipioInput = document.getElementById("municipioInput");
	var borrarButton = document.getElementById("borrarButton");
	var sendButton = document.getElementById("sendButton");
	var selectProvincia = document.getElementById("selectProvincia");
	var selectSorting = document.getElementById("selectSorting");
	var selectStatsProvincia = document.getElementById("selectStatsProvincia");
	
	provincia = selectProvincia.value;
	sortingStrategy = selectSorting.value;
	statsProvincia = selectStatsProvincia.value;

	loadState();
	drawMap();
	drawMunicipiosList();
	addProvinciasToSelect();
	drawStats();

	municipioInput.addEventListener("keypress", function(event) {
		if (event.key === "Enter") {
			event.preventDefault();
			tryGuess();
		}
	});

	borrarButton.addEventListener("click", function(event) {
		clearState();
		loadPage();
	});

	sendButton.addEventListener("click", function(event) {
		tryGuess();
	});

	selectProvincia.addEventListener("change", function(event) {
		provincia = event.target.value;
		loadPage();
	});

	selectSorting.addEventListener("change", function(event) {
		sortingStrategy = event.target.value;
		drawMunicipiosList();
	});
	
	selectStatsProvincia.addEventListener("change", function(event) {
		statsProvincia = selectStatsProvincia.value;
		drawStats();
	});

	function tryGuess() {
		guess = removeDiacritics(municipioInput.value.toLowerCase().trimStart().trimEnd());
		if(municipios[provincia][guess] && municipios[provincia][guess].synonym)
			guess = municipios[provincia][guess].synonym
		
		if(municipios[provincia][guess] && !state[provincia].includes(guess)) {
			addMunicipioToState(guess)
			selectMunicipio(municipios[provincia][guess]);
			drawMunicipiosList();
			drawStats();
			rightGuessAnimation();
		} else {
			wrongGuessAnimation();
		}
		guess += '2';
		if(municipios[provincia][guess] && !state[provincia].includes(guess)) {
			addMunicipioToState(guess)
			selectMunicipio(municipios[provincia][guess]);
			drawMunicipiosList()
			drawStats();
		}
		municipioInput.value = "";
	}
	
	function rightGuessAnimation() {
		municipioInput.classList.add('animation-rightGuess');
		setTimeout(() => {
			municipioInput.classList.remove('animation-rightGuess')
		}, 1000);
	}

	function wrongGuessAnimation() {
		municipioInput.classList.add('animation-wrongGuess');
		setTimeout(() => {
			municipioInput.classList.remove('animation-wrongGuess')
		}, 1000);
	}

	function addProvinciasToSelect() {
		var provincias = [...new Set(Object.entries(municipios[provincia]).map(m => {
					return m[1].provincia;
				}
			).filter(m => m).sort())];
		
		selectStatsProvincia.innerHTML = '';

		var option = document.createElement("option");
		option.value = 'all';
		option.innerHTML = 'Todas las provincias';
		selectStatsProvincia.appendChild(option);

		provincias.forEach(p => {
			var option = document.createElement("option");
			option.value = p;
			option.innerHTML = p;
			selectStatsProvincia.appendChild(option);
		});
		
		statsProvincia = selectStatsProvincia.value;
	}
}

function isRightProvincia(provincia) {
	if (statsProvincia === 'all')
		return true;
	return statsProvincia === provincia;
}

function newStats() {
	return {
		"totalMunicipios": 0,
		"bigMunicipios": 0,
		"mediumMunicipios": 0,
		"totalArea": 0,
		"totalPopulation": 0,
		"capitals": 0
	};
}

function addMunicipioToStats(stats, municipio) {
	if(municipio.skip)
		return stats;
	stats.totalMunicipios = stats.totalMunicipios + 1;
	if (municipio.population > BIG_CITY_POPULATION) {
		stats.bigMunicipios = stats.bigMunicipios + 1;
	}
	if (municipio.population > MEDIUM_CITY_POPULATION) {
		stats.mediumMunicipios = stats.mediumMunicipios + 1;
	}
	stats.totalPopulation = stats.totalPopulation + municipio.population;
	stats.totalArea = stats.totalArea + municipio.area;
	if (municipio.capital) {
		stats.capitals = stats.capitals + 1;
	}
	return stats;
}

function drawStats() {
	var stats = calculateStats(state[provincia]);
	var totalStats = calculateStats(Object.keys(municipios[provincia]));
	var totalMunicipiosStat = document.getElementById("numberOfMunicipios");
	var bigMunicipiosStat = document.getElementById("numberOfBigMunicipios");
	var mediumMunicipiosStat = document.getElementById("numberOfMediumMunicipios");
	var totalPopulation = document.getElementById("totalPopulation");
	var totalArea = document.getElementById("totalArea");
	totalMunicipiosStat.innerHTML = beautifyNumber(stats.totalMunicipios) + " de " + beautifyNumber(totalStats.totalMunicipios) + " municipios encontrados";
	capitals.innerHTML = beautifyNumber(stats.capitals) + " de " + beautifyNumber(totalStats.capitals) + " capitales";
	bigMunicipiosStat.innerHTML = beautifyNumber(stats.bigMunicipios) + " de " + beautifyNumber(totalStats.bigMunicipios) + " con más de " + beautifyNumber(BIG_CITY_POPULATION) + " habitantes";
	mediumMunicipiosStat.innerHTML = beautifyNumber(stats.mediumMunicipios) + " de " + beautifyNumber(totalStats.mediumMunicipios) + " con más de " + beautifyNumber(MEDIUM_CITY_POPULATION) + " habitantes";
	totalArea.innerHTML = beautifyNumber(stats.totalArea) + " de " + beautifyNumber(totalStats.totalArea) + " km² cubiertos";
	totalPopulation.innerHTML = beautifyNumber(stats.totalPopulation) + " de " + beautifyNumber(totalStats.totalPopulation) + " habitantes";
}

function beautifyNumber(number) {
	return number.toLocaleString();
}

function drawMap() {
	document.getElementById('mapSvg').innerHTML = mapSvg[provincia];
	state[provincia].forEach(m => {
		selectMunicipio(municipios[provincia][m]);
	});
}

function drawMunicipiosList() {
	clearMunicipiosList();
	getSortedMunicipios().forEach(m => {
		addMunicipioToList(m.name, m.extraInfo);
	});
}

function getSortedMunicipios() {
	if (sortingStrategy === 'order-asc')
		return state[provincia]
			.map(m => {return {name: municipios[provincia][m].name}})
	if (sortingStrategy === 'population-asc')
		return state[provincia]
			.toSorted((a, b) => municipios[provincia][a].population - municipios[provincia][b].population)
			.map(m => {return {name: municipios[provincia][m].name, extraInfo: municipios[provincia][m].population}})
	if (sortingStrategy === 'population-desc')
		return state[provincia]
			.toSorted((a, b) => municipios[provincia][b].population - municipios[provincia][a].population)
			.map(m => {return {name: municipios[provincia][m].name, extraInfo: municipios[provincia][m].population}})
	if (sortingStrategy === 'area-asc')
		return state[provincia]
			.toSorted((a, b) => municipios[provincia][a].area - municipios[provincia][b].area)
			.map(m => {return {name: municipios[provincia][m].name, extraInfo: municipios[provincia][m].area}})
	if (sortingStrategy === 'area-desc')
		return state[provincia]
			.toSorted((a, b) => municipios[provincia][b].area - municipios[provincia][a].area)
			.map(m => {return {name: municipios[provincia][m].name, extraInfo: municipios[provincia][m].area}})
	return state[provincia].toReversed().map(m => {return {name: municipios[provincia][m].name}})
}

function loadState() {
	if(localStorage.state) {
		try {
			state = JSON.parse(localStorage.state);
			// Add missing keys (can happen when adding new provincias)
			Object.keys(INITIAL_STATE).forEach(k => {
					if (!state[k])
						state[k] = INITIAL_STATE[k];
				}
			);
		} catch (e) {
			console.log("Error while loading state from local storage", e);
			state = INITIAL_STATE;
		}
	}

	saveState();
}

function calculateStats(municipiosList) {
	var stats = newStats();
	municipiosList
	.filter(m => {
		return !municipios[provincia][m].synonym
	})
	.filter(m => {
		return isRightProvincia(municipios[provincia][m].provincia)
	})
	.forEach(m => {
		addMunicipioToStats(stats, municipios[provincia][m]);
	});
	return stats;
}

function selectMunicipio(municipio) {
	municipio.paths.forEach(pathId => {
		var path = document.getElementById(pathId);
		path.classList.add("selected");
	});
}

function addMunicipioToState(id) {
	state[provincia].push(id);
	saveState();
}

function clearState() {
	state[provincia] = [];
	saveState();
}

function saveState() {
	localStorage.state = JSON.stringify(state);
}

function addMunicipioToList(name, extraInfo) {
	var municipiosList = document.getElementById("municipiosList");
	var li = document.createElement("li");
	li.classList.add("listItem");
	li.innerHTML = name + (extraInfo ? ' <em>(' + beautifyNumber(extraInfo) + ')</em>' : '');
	municipiosList.appendChild(li);
}

function clearMunicipiosList() {
	var municipiosList = document.getElementById("municipiosList");
	municipiosList.replaceChildren();
}

// SOURCE: http://stackoverflow.com/a/5912746/1260526
const diacriticsMap = [
    {'base':'A', 'letters':/[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/gm},
    {'base':'AA','letters':/[\uA732]/gm},
    {'base':'AE','letters':/[\u00C6\u01FC\u01E2]/gm},
    {'base':'AO','letters':/[\uA734]/gm},
    {'base':'AU','letters':/[\uA736]/gm},
    {'base':'AV','letters':/[\uA738\uA73A]/gm},
    {'base':'AY','letters':/[\uA73C]/gm},
    {'base':'B', 'letters':/[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/gm},
    {'base':'C', 'letters':/[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/gm},
    {'base':'D', 'letters':/[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/gm},
    {'base':'DZ','letters':/[\u01F1\u01C4]/gm},
    {'base':'Dz','letters':/[\u01F2\u01C5]/gm},
    {'base':'E', 'letters':/[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/gm},
    {'base':'F', 'letters':/[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/gm},
    {'base':'G', 'letters':/[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/gm},
    {'base':'H', 'letters':/[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/gm},
    {'base':'I', 'letters':/[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/gm},
    {'base':'J', 'letters':/[\u004A\u24BF\uFF2A\u0134\u0248]/gm},
    {'base':'K', 'letters':/[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/gm},
    {'base':'L', 'letters':/[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/gm},
    {'base':'LJ','letters':/[\u01C7]/gm},
    {'base':'Lj','letters':/[\u01C8]/gm},
    {'base':'M', 'letters':/[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/gm},
    {'base':'N', 'letters':/[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/gm},
    {'base':'NJ','letters':/[\u01CA]/gm},
    {'base':'Nj','letters':/[\u01CB]/gm},
    {'base':'O', 'letters':/[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/gm},
    {'base':'OI','letters':/[\u01A2]/gm},
    {'base':'OO','letters':/[\uA74E]/gm},
    {'base':'OU','letters':/[\u0222]/gm},
    {'base':'P', 'letters':/[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/gm},
    {'base':'Q', 'letters':/[\u0051\u24C6\uFF31\uA756\uA758\u024A]/gm},
    {'base':'R', 'letters':/[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/gm},
    {'base':'S', 'letters':/[\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/gm},
    {'base':'T', 'letters':/[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/gm},
    {'base':'TZ','letters':/[\uA728]/gm},
    {'base':'U', 'letters':/[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/gm},
    {'base':'V', 'letters':/[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/gm},
    {'base':'VY','letters':/[\uA760]/gm},
    {'base':'W', 'letters':/[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/gm},
    {'base':'X', 'letters':/[\u0058\u24CD\uFF38\u1E8A\u1E8C]/gm},
    {'base':'Y', 'letters':/[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/gm},
    {'base':'Z', 'letters':/[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/gm},
    {'base':'a', 'letters':/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/gm},
    {'base':'aa','letters':/[\uA733]/gm},
    {'base':'ae','letters':/[\u00E6\u01FD\u01E3]/gm},
    {'base':'ao','letters':/[\uA735]/gm},
    {'base':'au','letters':/[\uA737]/gm},
    {'base':'av','letters':/[\uA739\uA73B]/gm},
    {'base':'ay','letters':/[\uA73D]/gm},
    {'base':'b', 'letters':/[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/gm},
    {'base':'c', 'letters':/[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/gm},
    {'base':'d', 'letters':/[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/gm},
    {'base':'dz','letters':/[\u01F3\u01C6]/gm},
    {'base':'e', 'letters':/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/gm},
    {'base':'f', 'letters':/[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/gm},
    {'base':'g', 'letters':/[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/gm},
    {'base':'h', 'letters':/[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/gm},
    {'base':'hv','letters':/[\u0195]/gm},
    {'base':'i', 'letters':/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/gm},
    {'base':'j', 'letters':/[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/gm},
    {'base':'k', 'letters':/[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/gm},
    {'base':'l', 'letters':/[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/gm},
    {'base':'lj','letters':/[\u01C9]/gm},
    {'base':'m', 'letters':/[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/gm},
    {'base':'n', 'letters':/[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/gm},
    {'base':'nj','letters':/[\u01CC]/gm},
    {'base':'o', 'letters':/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/gm},
    {'base':'oi','letters':/[\u01A3]/gm},
    {'base':'ou','letters':/[\u0223]/gm},
    {'base':'oo','letters':/[\uA74F]/gm},
    {'base':'p', 'letters':/[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/gm},
    {'base':'q', 'letters':/[\u0071\u24E0\uFF51\u024B\uA757\uA759]/gm},
    {'base':'r', 'letters':/[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/gm},
    {'base':'s', 'letters':/[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/gm},
    {'base':'t', 'letters':/[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/gm},
    {'base':'tz','letters':/[\uA729]/gm},
    {'base':'u', 'letters':/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/gm},
    {'base':'v', 'letters':/[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/gm},
    {'base':'vy','letters':/[\uA761]/gm},
    {'base':'w', 'letters':/[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/gm},
    {'base':'x', 'letters':/[\u0078\u24E7\uFF58\u1E8B\u1E8D]/gm},
    {'base':'y', 'letters':/[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/gm},
    {'base':'z', 'letters':/[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/gm}
];

function removeDiacritics(str) {
    let i = diacriticsMap.length
    while(--i) {
        str = str.replaceAll(diacriticsMap[i].letters, diacriticsMap[i].base)
    }
	str = str.replaceAll('-', ' ')
	str = str.replaceAll('\'', ' ')
    return str
}

// Helper functions

function paintProvincia(provincia, color) {
	Object.entries(municipios.spain)
	.filter(m => m[1].provincia === provincia)
	.map(m => m[1].paths).forEach(paths => {
		try {
			paths.forEach(p => document.getElementById(p).setAttribute('fill', color));
		} catch(e) {
			console.log(paths);
		}
	});
}

function paintProvincias() {
	var color1 = '#f8ec76';
	var color2 = '#ffb382';
	var color3 = '#ffd6d4';
	var color4 = '#fbffcd';
	paintProvincia('Araba/Álava', color1);
	paintProvincia('Albacete', color2);
	paintProvincia('Alacant/Alicante', color3);
	paintProvincia('Almería', color4);
	paintProvincia('Ávila', color4);
	paintProvincia('Badajoz', color3);
	paintProvincia('Illes Balears', color2);
	paintProvincia('Barcelona', color1);
	paintProvincia('Burgos', color4);
	paintProvincia('Cáceres', color1);
	paintProvincia('Cádiz', color3);
	paintProvincia('Castelló/Castellón', color3);
	paintProvincia('Ciudad Real', color4);
	paintProvincia('Córdoba', color2);
	paintProvincia('A Coruña', color3);
	paintProvincia('Cuenca', color1);
	paintProvincia('Girona', color3);
	paintProvincia('Granada', color3);
	paintProvincia('Guadalajara', color4);
	paintProvincia('Gipuzkoa', color3);
	paintProvincia('Huelva', color1);
	paintProvincia('Huesca', color3);
	paintProvincia('Jaén', color1);
	paintProvincia('León', color4);
	paintProvincia('Lleida', color2);
	paintProvincia('La Rioja', color2);
	paintProvincia('Lugo', color1);
	paintProvincia('Madrid', color3);
	paintProvincia('Málaga', color1);
	paintProvincia('Murcia', color1);
	paintProvincia('Navarra', color4);
	paintProvincia('Ourense', color2);
	paintProvincia('Asturias', color2);
	paintProvincia('Palencia', color1);
	paintProvincia('Las Palmas', color2);
	paintProvincia('Pontevedra', color4);
	paintProvincia('Salamanca', color2);
	paintProvincia('Santa Cruz de Tenerife', color1);
	paintProvincia('Cantabria', color3);
	paintProvincia('Segovia', color2);
	paintProvincia('Sevilla', color4);
	paintProvincia('Soria', color3);
	paintProvincia('Tarragona', color4);
	paintProvincia('Teruel', color2);
	paintProvincia('Toledo', color2);
	paintProvincia('València/Valencia', color4);
	paintProvincia('Valladolid', color3);
	paintProvincia('Bizkaia', color2);
	paintProvincia('Zamora', color1);
	paintProvincia('Zaragoza', color1);
	paintProvincia('Ceuta', color2);
	paintProvincia('Melilla', color3);
	paintProvincia('', 'black');
}