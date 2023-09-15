/*****************************************************************************
components.js
Contains custom components for A-Frame.
******************************************************************************/

//Component for 3D Force Graph VR that to make spheres with text more compatible
AFRAME.registerComponent("spherize", {
  schema: {},
  dependencies: ["forcegraph"],
  init: function () {
    // spheres are cached here and re-used
    this.spheres = new Map();
  },
  tick: function (time, timeDelta) {
    document.querySelectorAll("a-entity[raycaster]").forEach((child) => {
      //reinitialises the whitelist for the raycaster
      child.setAttribute("raycaster", {
        objects: "[forcegraph], .collidable",
      });
    });
    document
      .querySelector("[forcegraph]")
      .components.forcegraph.forceGraph.children.forEach((child) => {
        if (child.type == "Mesh" && child.__data.id) {
          let sphereEl = this.spheres.get(child.__data.id);
          if (sphereEl) {
            // reuse existing sphere and label, but change its position
            sphereEl.object3D.position.copy(child.position);
            sphereEl.setAttribute("color", child.__data.color);
          } else {
            sphereEl = document.createElement("a-entity");
            sphereEl.classList.add("node");
            //copy the node's properties to the sphere element
            sphereEl.id = child.__data.id;
            this.spheres.set(child.__data.id, sphereEl);
            let radius = child.__data.radius;
            child.__data.radius = 5 * radius;
            sphereEl.setAttribute("position", child.position);
            let color = child.__data.color || "white";
            let compColor = "white";
            sphereEl.setAttribute("color", color);
            this.el.appendChild(sphereEl);

            //create the text label to place above the sphere
            let label = document.createElement("a-entity");
            let originalText = child.__data.short_label;
            let totalWidth = originalText.length * ((radius * 400) / 160);
            let totalHeight = 2 * ((radius * 400) / 160);
            let labelBackground = document.createElement("a-entity");
            labelBackground.setAttribute("geometry", {
              primitive: "plane",
              width: totalWidth,
              height: totalHeight,
            });
            labelBackground.setAttribute("material", {
              color: "gray",
              opacity: 0.5,
            });
            labelBackground.setAttribute("position", { x: 0, y: 1, z: -1 });

            label.setAttribute("text", {
              value: originalText,
              color: compColor,
              width: radius * 400,
              align: "center",
              wrapCount: 160,
            });
            sphereEl.setAttribute("look-at", "#camera");
            label.setAttribute("position", {
              x: 0,
              y: 5 * radius,
              z: 5 * radius,
            });
            sphereEl.appendChild(label);
          }
        }
      });
  },
});

//Component that adds funcitonality for removing the HUD when the B button is pressed
AFRAME.registerComponent("remove-hud", {
  init: function () {
    // Listen for the gamepadbuttondown event
    this.el.addEventListener("bbuttondown", (event) => {
      const nodeHUD = document.querySelector("#nodeHUD");
      // If "nodeHUD" exists, remove it from the scene
      if (nodeHUD) {
        nodeHUD.parentNode.removeChild(nodeHUD);
        document
          .querySelector("[forcegraph]")
          .components.forcegraph.data.nodes.forEach((node) => {
            const col = getOntologyColor(node);
            const numericColor = parseInt(col.substring(1), 16);
            node.marker.material.color.setHex(numericColor);
            node.color = col;
          });
      }
    });
  },
});

//Component that toggles the search bar and keyboard when the A button is pressed
AFRAME.registerComponent("search-popup", {
  init: function () {
    this.el.addEventListener("abuttondown", (event) => {
      let kb = document.querySelector("#keyboard");
      const camera = document.querySelector("#camera");
      //if the keyboard exists, remove it - else create a new one
      if (kb) {
        kb.parentNode.removeChild(kb);
        document
          .querySelector("#searchBar")
          .parentNode.removeChild(document.querySelector("#searchBar"));
        document
          .querySelector("#searchText")
          .parentNode.removeChild(document.querySelector("#searchText"));
      } else {
        //create the keyboard
        kb = document.createElement("a-entity");
        kb.setAttribute("id", "keyboard");
        kb.setAttribute("position", "-0.5 0 -2");
        kb.setAttribute("a-keyboard", "");
        kb.setAttribute("scale", "3 3 3");
        camera.appendChild(kb);

        //create the search bar
        searchBar = document.createElement("a-entity");
        searchBar.setAttribute("id", "searchBar");
        searchBar.setAttribute("htmlembed", "");
        searchBar.setAttribute("position", "0 0.5 -2");
        searchBar.setAttribute("class", "collidable");
        var searchText = document.createElement("h1");
        searchText.setAttribute("id", "searchText");
        searchText.style.backgroundColor = "white";
        searchText.textContent = "Search...";
        searchText.className = "searchBarVR";

        searchBar.appendChild(searchText);
        camera.appendChild(searchBar);
      }
    });
  },
});

//function to handle behaviour when a key is pressed on virtual keyboard
var input = "";
function updateInput(e) {
  var code = parseInt(e.detail.code);
  const searchHeader = document.querySelector("#searchText");
  switch (code) {
    case 8:
      input = input.slice(0, -1);
      searchHeader.textContent = input;
      break;
    case 6:
      var keyboard = document.querySelector("#keyboard");
      document
        .querySelector("[forcegraph]")
        .components.forcegraph.data.nodes.forEach((node) => {
          const col = getOntologyColor(node);
          const numericColor = parseInt(col.substring(1), 16);
          node.marker.material.color.setHex(numericColor);
          node.color = col;
        });
      highlite_node(input);
      input = "";
      keyboard.parentNode.removeChild(keyboard);
      if (document.querySelector("#searchBar")) {
        document
          .querySelector("#searchBar")
          .parentNode.removeChild(document.querySelector("#searchBar"));
      }
      if (document.querySelector("#searchText")) {
        document
          .querySelector("#searchText")
          .parentNode.removeChild(document.querySelector("#searchText"));
      }

      return;
    default:
      input = input + e.detail.value;
      searchHeader.textContent = input;
      break;
  }
  //   document.querySelector("#input").setAttribute("value", input + "_");
}
//listener for when a key is pressed on the virtual keyboard
document.addEventListener("a-keyboard-update", updateInput);
//dev function to simulate a button press with the space bar
// document.addEventListener('keyup', event => {
//     if (event.code === 'Space') {
//         let kb = document.querySelector("#keyboard");
//       const camera = document.querySelector("#camera");
//       if (kb) {
//         kb.parentNode.removeChild(kb);
//         document
//           .querySelector("#searchBar")
//           .parentNode.removeChild(document.querySelector("#searchBar"));
//         document
//           .querySelector("#searchText")
//           .parentNode.removeChild(document.querySelector("#searchText"));
//       } else {
//         kb = document.createElement("a-entity");
//         kb.setAttribute("id", "keyboard");
//         kb.setAttribute("position", "-0.5 0 -2");
//         kb.setAttribute("a-keyboard", "");
//         kb.setAttribute("scale", "3 3 3");
//         camera.appendChild(kb);
//         searchBar = document.createElement("a-entity");
//         searchBar.setAttribute("id", "searchBar");
//         searchBar.setAttribute("htmlembed", "");
//         searchBar.setAttribute("position", "0 0.25 -2");
//         searchBar.setAttribute("class", "collidable");
//         var searchText = document.createElement("h1");
//         searchText.setAttribute("id", "searchText");
//         searchText.style.backgroundColor = "white";
//         searchText.style.display = 'inline-block';
// 		searchText.style.whiteSpace = 'nowrap';
// 		searchText.style.overflow = 'hidden';
// 		searchText.style.textOverflow = 'ellipsis';
// 		searchText.style.maxWidth = '100%';
//         searchText.textContent = "Search...";
//         searchText.className = "searchBarVR";

//         searchBar.appendChild(searchText);
//         camera.appendChild(searchBar);
//       }
//     }
//   })
