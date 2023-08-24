AFRAME.registerComponent('controller-events', {
    init: function () {
        const dropdownPlane = document.createElement('a-entity');
        dropdownPlane.setAttribute('id', '#controller-dropdown');
        dropdownPlane.setAttribute("geometry", {
            primitive: 'plane',
             height: 5,
              width: 5,
          });
        dropdownPlane.setAttribute("material", {
            color: 'gray',
            opacity: 0.5
          });
        const temp = document.createElement("a-html");
        temp.setAttribute("src", "#dd");
        dropdownPlane.appendChild(temp);
        const controller = document.querySelector("a-entity[laser-controls]");
        controller.appendChild(dropdownPlane);
      const el = this.el;
  
      // When the trigger button is pressed
      el.addEventListener('triggerdown', () => {
        const dropdownPlane = document.querySelector('a-entity[dropdown-controller]');
        dropdownPlane.setAttribute('visible', 'true');
      });
  
      // When the trigger button is released
      el.addEventListener('triggerup', () => {
        const dropdownPlane = document.querySelector('a-entity[dropdown-controller]');
        dropdownPlane.setAttribute('visible', 'false');
      });
    }
  });