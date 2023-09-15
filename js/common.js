/*****************************************************************************
common.js
******************************************************************************/

init_search();
init_interface();
let fix_z = -100;
$(document).foundation();

// Try this in case URL had path, before chosen() is applied
var auto_load = document.location.href.indexOf("?ontology=");
if (auto_load) {
  var choice = document.location.href.substr(auto_load + 10).toLowerCase();
  $("#ontology")
    .children(`option[value="data/${choice}.json"]`)
    .attr("selected", "selected");
  $("#ontology").trigger("change");
}

// Saves an object as a JSON
function save(blob, filename) {
  var link = document.createElement("a");
  link.style.display = "none";
  document.body.appendChild(link);

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Helper function to save nodes/links as JSON
function saveString(text, filename) {
  save(new Blob([text], { type: "text/plain" }), filename);
}

function init_interface() {
  // Selection list of all node labels allows user to zoom in on one
  $("#ontology").on("change", function (item) {
    if (this.value > "") {
      const cache_url = $("select#ontology option").filter(":selected")[0]
        .dataset.cache;

      var request = new XMLHttpRequest();
      request.open("GET", cache_url, false);
      request.send();
      if (request.status == 404) {
        load_data(this.value, do_graph);
      } else {
        load_data(this.value, load_graph);
      }
    }
  });

  $("#ontology").chosen({ placeholder_text_single: "Select an item ..." });

  // Allows user to re-render the ontology instead of loading up a snapshot
  $("#rerender_button").on("click", function (item) {
    do_graph();
  });

  // Allows the user to download JSONs for the nodes and links of the ontology
  $("#download_button").on("click", function (item) {
    const { nodes, links } = top.GRAPH.graphData();
    const nodes_out = nodes.map(({ id, x, y, z }) => ({ id, x, y, z }));

    for (i = 0; i < nodes_out.length; i++) {
      nodes_out[i].x = parseInt(nodes_out[i].x, 10);
      nodes_out[i].y = parseInt(nodes_out[i].y, 10);
      nodes_out[i].z = parseInt(nodes_out[i].z, 10);
    }

    const out_obj = {
      nodes: nodes_out,
      // 'meta': top.RAW_DATA
    };
    saveString(JSON.stringify(out_obj), "cache.json");
  });

  // Selection list of all node labels allows user to zoom in on one
  $("#label_search").on("change", function (item) {
    if (this.value != "") setNodeReport(top.dataLookup[this.value]);
  });

  $("#upload_cache").on("change", function (event) {
    var reader = new FileReader();

    reader.onload = function (event) {
      top.NODES_JSON = JSON.parse(event.target.result);
    };

    reader.readAsText(event.target.files[0]);
  });

  // Uploads JSON cache file
  $("#upload_json_button").on("click", function (item) {
    const cache_url = $("#upload_cache").val();
    const onto_url = $("#ontology_url").val();
    const url_ok = RE_URL.exec(onto_url);

    if (!url_ok) {
      alert(`The ontology URL: "${onto_url}" is not valid`);
    }

    if (cache_url > "" && url_ok) {
      try {
        load_uploaded_graph();
      } catch (err) {
        alert(
          "Something is wrong with either the URL or the cache file. Ensure that the URL is pointing directly to an owl rdf/xml file and that the cache file corresponds to the correct ontology. " +
            err.message
        );
        data = null;
      }
    }
  });

  $("#ontology_url_button").on("click", function (item) {
    const url = $("#ontology_url").val();
    const url_ok = RE_URL.exec(url);
    if (url_ok)
      try {
        load_data(url, do_graph);
      } catch (err) {
        alert(
          "URL fetch didn't work. Note, URL must point directly to an owl rdf/xml file.  It can't be redirected to another location: " +
            err.message
        );
        data = null;
      }
    else alert(`The ontology URL: "${url}" is not valid`);
  });

  // Top level setting controls whether shortcuts on rendering speed things up
  $("#render_deprecated").on("change", function (item) {
    RENDER_DEPRECATED = this.checked;
    do_graph(); // Recalculate dataset with deprecated terms
  });

  // upper level ontology edge coloring
  $("input[name='ulo_edge_coloring']").on("click", function (item) {
    RENDER_ULO_EDGE = this.value == "true";
    $("#ulo_legend").toggle(RENDER_ULO_EDGE);
    $("#ontology_legend").toggle(!RENDER_ULO_EDGE);

    if (top.GRAPH) {
      top.GRAPH.refresh();
    }
  });

  // Top level setting controls whether shortcuts on rendering speed things up
  $("#render_slices").on("change", function (item) {
    RENDER_SLICES = this.checked;
    do_graph(); // Recalculate dataset with deprecated terms
  });

  $("#thickness_control").on("change", function (item) {
    GRAPH_LINK_WIDTH = parseFloat(this.value);
    if (top.GRAPH) {
      top.GRAPH.refresh();
    }
  });

  // Top level setting controls whether shortcuts on rendering speed things up
  $("#render_quicker").on("change", function (item) {
    RENDER_QUICKER = this.checked;
    if (top.GRAPH) {
      top.GRAPH.refresh();
    }
  });

  $("#render_labels").on("change", function (item) {
    RENDER_LABELS = this.checked;
    top.GRAPH.refresh();
  });

  $("#render_dimensions").on("change", function (item) {
    GRAPH_DIMENSIONS = parseInt(this.value);
    if (top.GRAPH) {
      // It appears iterative algorithm doesn't work with num dimensions
      // because it fixes x,y,z of parent nodes.  Must switch to alternate
      // rendering algorithm, or relax x,y,z for nodes below a certain depth.
      top.GRAPH.numDimensions(GRAPH_DIMENSIONS);
      do_graph();
    }
  });

  $("#render_layer_depth").on("change", function (item) {
    GRAPH_NODE_DEPTH = parseInt(this.value);
    do_graph();
  });

  // Controls depth of nodes being rendered.
  $("#depth_control").on("change", function (item) {
    RENDER_DEPTH = parseInt(this.value);
    do_graph();
  });

  // Selection list of all node labels allows user to zoom in on one
  $("#select_child").on("change", function (item) {
    if (this.value != "") setNodeReport(top.dataLookup[this.value]);
  });
  var select = document.createElement("select");

  // Create an array of selectable values
  var values = [1, 2, 3, 4, 5];

  // // Populate the select element with options
  values.forEach(function (value) {
    var option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
  
}

/************************** CONTRADICTION REPORTING ***************************/

function load_data(URL, callback) {
  /*
    Fetch json data file that represents simplified .owl ontology
    OR owl file in rdf/xml format 
  */

  var xhttp = new XMLHttpRequest();
  var json_file_type = URL.toLowerCase().indexOf("json") > 0;
  if (json_file_type) xhttp.overrideMimeType("application/json");
  else xhttp.overrideMimeType("rdf/xml");

  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        try {
          if (json_file_type) {
            // CONVERSION JSON data to work with new OWL format
            var data = JSON.parse(this.responseText);

            Object.keys(data.specifications).forEach(function (id) {
              var node = data.specifications[id];
              node["rdfs:subClassOf"] = [node.parent_id];
              if (node.label) node["rdfs:label"] = node.label;
              if (node.definition) node["IAO:0000115"] = node.definition;
              if (node.deprecated) node["owl:deprecated"] = node.deprecated;

              if (node.other_parents)
                node["rdfs:subClassOf"].push(...node.other_parents);
            });

            data.term = data.specifications;
            delete data.specifications;
          } else {
            var store = $rdf.graph();
            // Give it a full URL so OWL has proper file address
            if (URL.indexOf("http") != 0)
              URL = RE_URL.exec(document.location) + URL;

            try {
              // Given url is used simply to identify ontology source.
              // Good tips here: https://github.com/solid/solid-tutorial-rdflib.js/issues/4
              $rdf.parse(this.responseText, store, URL, "application/rdf+xml");
              data = process_ontology(store);
              var store = $rdf.graph();
            } catch (err) {
              console.log(err);
              alert("OWL couldn't parse" + err.message);
              data = null;
            }
          }
        } catch (err) {
          alert("Error:" + err.message);
          data = null;
        }

        top.RAW_DATA = data;
        callback();
      } else {
        alert(
          "There was a problem loading this URL! (If it redirects somewhere, that isn't allowed): " +
            URL
        );
      }
    }
  };
  xhttp.open("GET", URL, true);
  xhttp.send(null);
}

function init_search(data) {
  /*
    Create a select list of all the node labels, in alphabetical order.
    Includes search of the node's synonyms via a customization of chosen.js
  */

  var label_search = $("#label_search");
  label_search.empty().append('<option value="">Term search ...</option>');

  if (data) {
    // search
    var sorted_data = data.nodes.concat().sort(function (a, b) {
      return a.label === undefined || a.label.localeCompare(b.label);
    });

    for (var item in sorted_data) {
      var node = sorted_data[item];
      var option = $(
        `<option value="${node.id}">${node["rdfs:label"]}</option>`
      );

      // Search by any of the terms related synonyms
      var synonyms = [];
      SYNONYM_FIELD.forEach(function (synonym) {
        if (node[synonym]) synonyms.push(node[synonym]);
      });
      var synonym_str = synonyms.length ? ";" + synonyms.join(";") : "";

      // Allows searching by node id as well.
      option.attr("synonyms", node.id + synonym_str);

      label_search.append(option);
    }
  }

  label_search.chosen({
    placeholder_text_single: "Term search ...",
    no_results_text: "Oops, nothing found!",
    disable_search_threshold: 10,
    search_contains: true, //substring search
  });

  label_search.prop("disabled", data && data.nodes.length > 0 ? false : true);
  label_search.trigger("chosen:updated");
}

/*
  Redraw legends according to given data.nodes
  One legend prepared for count by ontology term prefix
  Other legend prepared for count by ULO group a term falls under 
*/
function set_legend(data) {
  var ontology = {};
  var ulo_branch = {};

  for (var ptr in data.nodes) {
    const node = data.nodes[ptr];
    const prefix = get_term_prefix(node.id);

    if (!node["owl:deprecated"]) {
      // Stores a count of each prefix
      if (prefix in ontology) ontology[prefix].count += 1;
      else {
        ontology[prefix] = {
          count: 1,
          label: prefix,
          color: prefix_color_mapping[prefix]
            ? prefix_color_mapping[prefix].color
            : null,
        };
      }
      // Figure out what to sort on

      // Store a count of ULO branch underlying nodes
      if (node.group_id in ulo_branch) ulo_branch[node.group_id].count += 1;
      else {
        const group = top.dataLookup[node.group_id];
        if (group) {
          const layout_group = top.layout[group.group_id];
          ulo_branch[group.group_id] = {
            count: 1,
            label: group["rdfs:label"],
            prefix: get_term_prefix(group.id),
            color: top.colors[layout_group.color],
            ulo: true,
          };
        }
      }
    }
  }
  set_legend_section("#ulo_legend", ulo_branch);
  set_legend_section("#ontology_legend", ontology);
}

// Render legend for coloring by ontology or ULO
function set_legend_section(dom_id, legend_dict) {
  $(dom_id).empty();

  for (var key of Object.keys(legend_dict).sort()) {
    item = legend_dict[key];
    // Don't show ULO category if only 1 item, or if there is a custom layout color for it
    if (!item.ulo || item.count > 1 || (item.prefix && top.layout[key].color)) {
      $(dom_id).append(
        `<div class="legend_color" style="background-color:${item.color}">${item.count}</div>
        <div class="legend_item">${item.label}</div>
        <br/>`
      );
    }
  }

  if ($(dom_id).children("div").length)
    $(dom_id).prepend(
      '<div class="legend_header">' +
        (dom_id == "#ulo_legend" ? "ULO Branch Legend" : "Ontology Legend") +
        "<div/>"
    );
}

/*
  Render details about node in sidebar, and position camera to look at
  node from same vertical level.
  An empty node parameter causes sidebar information to be cleared out.
*/
function setNodeReport(node = {}) {
  parents = get_term_id_urls(node["rdfs:subClassOf"]);

  // Label includes term id and links to
  if (node["rdfs:label"]) {
    label =
      node["rdfs:label"] +
      (node["owl:deprecated"]
        ? ' <span class="deprecated">deprecated</span>'
        : "") +
      '<span class="label_id"> (' +
      node.id +
      " " +
      lookup_url(node.id, "OntoBee") +
      ") </span>";
  } else {
    label = null;
  }

  $("#parents").html(parents || '<span class="placeholder">parent(s)</span>');
  $("#label").html(label || '<span class="placeholder">label</span>');
  // was node.definition
  $("#definition").html(
    node["IAO:0000115"] || '<span class="placeholder">definition</span>'
  );

  $("#synonyms").html(
    node.synonyms || '<span class="placeholder">synonyms</span>'
  );

  if (node.ui_label) $("#ui_label").show().html(node.ui_label);
  else $("#ui_label").hide();

  if (node.ui_definition) $("#ui_definition").show().html(node.ui_definition);
  else $("#ui_definition").hide();

  var select_child = $("#select_child");
  select_child.empty();
  select_child.css(
    "visibility",
    node.children && node.children.length > 0 ? "visible" : "hidden"
  );
  if (node.children && node.children.length > 0) {
    var option = document.createElement("option");
    select_child.append('<option value="">children ...</option>');

    for (var item in node.children) {
      const child = top.dataLookup[node.children[item]];
      if (child)
        select_child.append(
          `<option value="${child.id}">${child["rdfs:label"]}</option>`
        );
    }
  }

  // Aim viewport camera at node from z dimension
  // Unfortunately camera animations cause it to loose its "UP" position.
  // Solution?
  if (node.x) {
    // Color assigned here but rendered color isn't actually affected until
    // AFTER next rebuild of graph/viewport.
    node.color = "red";

    // This sets visual color directly in rendering engine so we don't have to
    // rerender graph as a whole!
    if (node.marker && node.marker.material) {
      node.marker.material.color.setHex(0xff0000);
      if (node.depth > 2) {
        node.marker.scale.x = 3;
        node.marker.scale.y = 3;
        //node.marker.scale.z = 3
      }
    }
  }
}