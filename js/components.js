// AFRAME.registerComponent('controller-events', {
//     init: function () {
//         const dropdownPlane = document.createElement('a-entity');
//         dropdownPlane.setAttribute('id', '#controller-dropdown');
//         dropdownPlane.setAttribute("geometry", {
//             primitive: 'plane',
//              height: 5,
//               width: 5,
//           });
//         dropdownPlane.setAttribute("material", {
//             color: 'gray',
//             opacity: 0.5
//           });
//         const temp = document.createElement("a-html");
//         temp.setAttribute("src", "#dd");
//         dropdownPlane.appendChild(temp);
//         const controller = document.querySelector("a-entity[laser-controls]");
//         controller.appendChild(dropdownPlane);
//       const el = this.el;

//       // When the trigger button is pressed
//       el.addEventListener('triggerdown', () => {
//         const dropdownPlane = document.querySelector('a-entity[dropdown-controller]');
//         dropdownPlane.setAttribute('visible', 'true');
//       });

//       // When the trigger button is released
//       el.addEventListener('triggerup', () => {
//         const dropdownPlane = document.querySelector('a-entity[dropdown-controller]');
//         dropdownPlane.setAttribute('visible', 'false');
//       });
//     }
//   });
AFRAME.registerComponent("spherize", {
  schema: {},
  dependencies: ["forcegraph"],
  init: function () {
    // spheres are cached here and re-used
    this.spheres = new Map();
  },
  tick: function (time, timeDelta) {
    // const controllers = document.querySelectorAll("a-entity[laser-controls]");
    // console.log(controllers[0].getAttribute('laser-controls'));
    document.querySelectorAll("a-entity[raycaster]").forEach((child) => {
      // console.log(child.getAttribute('raycaster'));
      child.setAttribute("raycaster", {
        objects: "[forcegraph], .collidable",
        // direction: "0 -1 0",
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
            sphereEl.id = child.__data.id;
            this.spheres.set(child.__data.id, sphereEl);
            let radius = child.__data.radius;
            child.__data.radius = 5 * radius;
            // sphereEl.setAttribute("radius", radius - 0.1);
            sphereEl.setAttribute("position", child.position);

            let color = child.__data.color || "white";
            let compColor = "white";
            sphereEl.setAttribute("color", color);
            this.el.appendChild(sphereEl);
            let label = document.createElement("a-entity");
            let originalText = child.__data.short_label;
            let splitText =
              originalText.length > 9
                ? originalText.substring(0, 8) +
                  "\n" +
                  originalText.substring(9)
                : originalText;
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
            // label.setAttribute('scale', '4 4 4');
            // label.appendChild(labelBackground);
            sphereEl.setAttribute("look-at", "#camera");
            label.setAttribute("position", {
              x: 0,
              y: 5 * radius,
              z: 5 * radius,
            });
            sphereEl.appendChild(label);
          }
        }
        // const s = (document.querySelector('a-sphere'));
        // s.setAttribute('radius', "10");
      });
  },
});
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
AFRAME.registerComponent("search-popup", {
  init: function () {
    // Listen for the gamepadbuttondown event
    console.log("event");

    this.el.addEventListener("abuttondown", (event) => {
        console.log("abutton");
      let kb = document.querySelector("#keyboard");
      const camera = document.querySelector("#camera");
      if (kb) {
        kb.parentNode.removeChild(kb);
        document
          .querySelector("#searchBar")
          .parentNode.removeChild(document.querySelector("#searchBar"));
        document
          .querySelector("#searchText")
          .parentNode.removeChild(document.querySelector("#searchText"));
      } else {
        kb = document.createElement("a-entity");
        kb.setAttribute("id", "keyboard");
        kb.setAttribute("position", "-0.5 0 -2");
        kb.setAttribute("a-keyboard", "");
        kb.setAttribute("scale", "3 3 3");
        camera.appendChild(kb);
        // console.log(document.querySelector("#keyboard"));
        searchBar = document.createElement("a-entity");
        // searchBar.setAttribute("")
        searchBar.setAttribute("id", "searchBar");
        searchBar.setAttribute("htmlembed", "");
        searchBar.setAttribute("position", "0 0.5 -2");
        // searchBar.setAttribute("scale", "3 3 3");
        searchBar.setAttribute("class", "collidable");
        // const label = document.querySelector('#label_search');
        var searchText = document.createElement("h1");
        searchText.setAttribute("id", "searchText");
        searchText.style.backgroundColor = "white";
        searchText.textContent = "Search...";
        searchText.className = "searchBarVR";
        // Create an array of selectable values

        searchBar.appendChild(searchText);
        camera.appendChild(searchBar);
      }
    });
  },
});
var input = "";
function updateInput(e) {
  console.log(input);
  var code = parseInt(e.detail.code);
  const searchHeader = document.querySelector("#searchText");
  switch (code) {
    case 8:
      input = input.slice(0, -1);
      searchHeader.textContent = input;
      break;
    case 6:
      console.log("submitted");
      var keyboard = document.querySelector("#keyboard");
      console.log(input);
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
      //   document.querySelector("#input").setAttribute("value", input);
      //   document.querySelector("#input").setAttribute("color", "blue");
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
document.addEventListener("a-keyboard-update", updateInput);
document.addEventListener('keyup', event => {
    if (event.code === 'Space') {
        let kb = document.querySelector("#keyboard");
      const camera = document.querySelector("#camera");
      if (kb) {
        kb.parentNode.removeChild(kb);
        document
          .querySelector("#searchBar")
          .parentNode.removeChild(document.querySelector("#searchBar"));
        document
          .querySelector("#searchText")
          .parentNode.removeChild(document.querySelector("#searchText"));
      } else {
        kb = document.createElement("a-entity");
        kb.setAttribute("id", "keyboard");
        kb.setAttribute("position", "-0.5 0 -2");
        kb.setAttribute("a-keyboard", "");
        kb.setAttribute("scale", "3 3 3");
        camera.appendChild(kb);
        // console.log(document.querySelector("#keyboard"));
        searchBar = document.createElement("a-entity");
        // searchBar.setAttribute("")
        searchBar.setAttribute("id", "searchBar");
        searchBar.setAttribute("htmlembed", "");
        searchBar.setAttribute("position", "0 0.25 -2");
        // searchBar.setAttribute("scale", "3 3 3");
        searchBar.setAttribute("class", "collidable");
        var searchText = document.createElement("h1");
        searchText.setAttribute("id", "searchText");
        searchText.style.backgroundColor = "white";
        searchText.style.display = 'inline-block';
		searchText.style.whiteSpace = 'nowrap';
		searchText.style.overflow = 'hidden';
		searchText.style.textOverflow = 'ellipsis';
		searchText.style.maxWidth = '100%';
        searchText.textContent = "Search...";
        searchText.className = "searchBarVR";
        // Create an array of selectable values

        searchBar.appendChild(searchText);
        camera.appendChild(searchBar);
      }
    }
  })