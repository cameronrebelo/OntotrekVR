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