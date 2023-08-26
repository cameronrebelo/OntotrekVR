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
      }
    });
  },
});
AFRAME.registerComponent("search-popup", {
  init: function () {
    // Listen for the gamepadbuttondown event
    console.log("event");

    this.el.addEventListener("abuttondown", (event) => {
      console.log("listener");
      let kb = document.querySelector("#keyboard");
      const camera = document.querySelector("#camera");
      if (kb) {
        kb.parentNode.removeChild(kb);
      }
      else{
        kb = document.createElement("a-entity");
        kb.setAttribute("id", "keyboard");
        kb.setAttribute("position", "-0.5 0 -2");
        kb.setAttribute("a-keyboard", "");
        kb.setAttribute("scale", "3 3 3");
        camera.appendChild(kb);
        console.log(document.querySelector("#keyboard"));
      }
    });
  },
});
var input = "";
function updateInput(e) {
    console.log(input);
  var code = parseInt(e.detail.code);
  switch (code) {
    case 8:
      input = input.slice(0, -1);
      break;
    case 6:
      console.log("submitted");
      var keyboard = document.querySelector("#keyboard");
      console.log(input);
      input = "";
      //   document.querySelector("#input").setAttribute("value", input);
      //   document.querySelector("#input").setAttribute("color", "blue");
      keyboard.parentNode.removeChild(keyboard);
      return;
    default:
      input = input + e.detail.value;
      break;
  }
//   document.querySelector("#input").setAttribute("value", input + "_");
}
document.addEventListener("a-keyboard-update", updateInput);
