// Initialize socket.io if not already
if (socket === undefined) {
    var socket = io();
}

function sendPosition(position, rotation) {
    socket.emit('update-pos', { position, rotation });
}

// TODO: make this a class, keep track of all with map of ids

function findVisitorRepr(id) {
    let el = document.querySelector('#user-' + id);
    return el;
}

function deleteVisitorRepr(id) {
    let el = document.querySelector('#user-' + id);
    if (el != null) {
        console.log("Deleting element for " + id);
        el.parentNode.removeChild(el);
    } else {
        console.warn("Couldn't find element to delete for " + id);
    }
}

function _defaultVisitorRepr(id, el) {
    var headEl = document.createElement('a-cone');
    headEl.setAttribute('height', 0.5);
    headEl.setAttribute('radius-bottom', 0.25);
    // rotate to point towards camera direction
    headEl.object3D.rotation.x = Math.PI / 2;
    el.appendChild(headEl);

    // line for pointing
    var lineEl = document.createElement('a-entity');
    lineEl.setAttribute('line', {
        start: { x: 0, y: 0, z: 0 }, 
        end: {x: 0, y: 0, z: -5},
        color: 'red',
        visible: true,
    });
    el.appendChild(lineEl);

    // name text
    var textEl = document.createElement('a-text');
    textEl.setAttribute('value', id);
    textEl.setAttribute('align', 'center');
    textEl.getAttribute('position').y = 0.5;
    textEl.object3D.rotation.y = Math.PI;
    el.appendChild(textEl);
    // make a second to point backwards
    var textEl2 = textEl.cloneNode();
    textEl2.getAttribute('position').y = 0.5;
    el.appendChild(textEl2);

}

function createVisitorRepr(id) {
    var sceneEl = document.querySelector('a-scene');
    var el = document.createElement('a-entity');
    el.id = 'user-' + id;

    if (typeof buildVisitorRepr !== "undefined") {
        buildVisitorRepr(id, el);
    } else {
        _defaultVisitorRepr(id, el);
    }

    sceneEl.appendChild(el);
    return el;
}

function setVisitorPointer(id, value) {
    let el = document.querySelector('#user-' + id);
    if (el == null) {
        return;
    }
    let pointerEl = el.querySelector('a-entity');
    pointerEl.setAttribute('visibility', value);
}

// add/update elements for other users
socket.on('visitor-update-pos', function (msg) {
    console.log('new update', msg);

    let el = findVisitorRepr(msg.id);
    if (el == null) {
        el = createVisitorRepr(msg.id);
        console.debug("Created new object for user " + msg.id, el);
    }
    el.setAttribute('position', msg.position);
    // el.object3D.position.set(msg.pos.position);
    el.object3D.setRotationFromQuaternion(msg.rotation);
});

socket.on('visitor-disconnect', function (msg) {
    const id = msg.id;
    deleteVisitorRepr(id);
})

AFRAME.registerComponent('rotation-reader', {
    /**
     * We use IIFE (immediately-invoked function expression) to only allocate one
     * vector or euler and not re-create on every tick to save memory.
     */
    tick: (function () {
        var position = new THREE.Vector3();
        var rotation = new THREE.Quaternion();

        var old_position = new THREE.Vector3();
        var old_rotation = new THREE.Quaternion();

        return function () {
            this.el.object3D.getWorldPosition(position);
            this.el.object3D.getWorldQuaternion(rotation);
            // position and rotation now contain vector and quaternion in world space.

            // only send on "significant" change
            // TODO: optimize this
            if (position.distanceTo(old_position) > 0.1 || rotation.angleTo(old_rotation) > Math.PI / 16) {
                console.log("postion updated");
                // hotfix quaternion properties for sending
                sendPosition(position, {x: rotation._x, y: rotation._y, z: rotation._z, w: rotation._w});
                this.el.object3D.getWorldPosition(old_position);
                this.el.object3D.getWorldQuaternion(old_rotation);
            }
        };
    })()
});
