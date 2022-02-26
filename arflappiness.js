var camera, scene, renderer;
function getXRSessionInit( mode, options) {
	if ( options && options.referenceSpaceType ) {
		renderer.xr.setReferenceSpaceType( options.referenceSpaceType );
	}
	var space = (options || {}).referenceSpaceType || 'local-floor';
	var sessionInit = (options && options.sessionInit) || {};	
	if ( space == 'viewer' )
		return sessionInit;
	if ( space == 'local' && mode.startsWith('immersive' ) )
		return sessionInit;
		
	if ( sessionInit.optionalFeatures && sessionInit.optionalFeatures.includes(space) )
		return sessionInit;
	if ( sessionInit.requiredFeatures && sessionInit.requiredFeatures.includes(space) )
		return sessionInit;
	var newInit = Object.assign( {}, sessionInit );
	newInit.requiredFeatures = [ space ];
	if ( sessionInit.requiredFeatures ) {
		newInit.requiredFeatures = newInit.requiredFeatures.concat( sessionInit.requiredFeatures );
	}
	return newInit;
}
function init() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.001, 10 );
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.xr.enabled = true;
	document.body.appendChild( renderer.domElement );
	window.addEventListener( 'resize', onWindowResize, false );
}
function AR(){
	var currentSession = null;
	function onSessionStarted( session ) {
		session.addEventListener( 'end', onSessionEnded );
		renderer.xr.setSession( session );
		button.style.display = 'none';
		button.textContent = 'exit AR';
		currentSession = session;
	}
	function onSessionEnded( /*event*/ ) {
		currentSession.removeEventListener( 'end', onSessionEnded );
		renderer.xr.setSession( null );
		button.textContent = 'enter AR' ;
		currentSession = null;
	}
	if ( currentSession === null ) {
		var sessionInit = getXRSessionInit( 'immersive-ar', {
			mode: 'immersive-ar',
			referenceSpaceType: 'local', // 'local-floor'
			sessionInit: {
				optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar'],
				domOverlay: {root: document.body}
			}
		});
		navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );
	} else {
		currentSession.end();
	}
	renderer.xr.addEventListener('sessionstart',
		function(ev) {
			console.log('sessionstart', ev);
			document.body.style.backgroundColor = 'rgba(0, 0, 0, 0)';
			renderer.domElement.style.display = 'none';
		});
	renderer.xr.addEventListener('sessionend',
		function(ev) {
			console.log('sessionend', ev);
			document.body.style.backgroundColor = '';
			renderer.domElement.style.display = '';
		});
}
// flappiness logic
let boxs = new THREE.Group()
let points = 0
let lastPoints = 0
let playerSize = []//none visible
let speed = 1
// Does
let pixRatio = window.devicePixelRatio;
let cellphoneObj = new THREE.BoxGeometry( 
    pixRatio * screen.width * 0.0254/96,  
    pixRatio * screen.height * 0.0254/96, 0.01, 1, 1, 1)
let cellphoneMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
let cellphoneMaterial.visible = false
let cellphoneMesh = new THREE.Mesh( cellphoneGeometry, cellphoneMaterial );
// This is a bad form of collision detections

let addBox = ()=>{
    let boxGeometry = new THREE.BoxGeometry( .3, .3, .3, 1,1,1 );
    let boxMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    let boxMesh = new THREE.Mesh( boxGeometry, boxMaterial );
    boxMesh.position( new THREE.Vector3(4*(Math.random()-0.5), Math.random()+0.5, -2) )
    return boxMesh
}
let clearScene = ()=>{
    for( var i = scene.children.length - 1; i >= 0; i--) { 
	     obj = scene.children[i];
	     scene.remove(obj); 
	}
}
let initScene = ()=>{
    for(let i; i<10; i++){
        let boxMesh = addBox()
        boxs.add( boxMesh );
    }
    scene.add( boxs );
}
let collisionDetect = (obj)=>{
    for (var vertexIndex = 0; vertexIndex < obj.geometry.vertices.length; vertexIndex++){		
		var localVertex = obj.geometry.vertices[vertexIndex].clone();
		var globalVertex = localVertex.applyMatrix4( obj.matrix );
		var directionVector = globalVertex.sub( obj.position );
		
		var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
		var collisionResults = ray.intersectObjects( boxs );
		if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ){
            // check the collision
            clearScene()
            lastPoints = points
            points = 0
            initScene()
        } 
	}	
}
let gameLoop = ()=>{
    for(let object of activeObjects){
        // check for valid if valid move forward else delete
        let z = object.position.z
        if(z>2){
            // remove object (add new object)
            let boxMesh = addBox()
            speed *= 1.005
            points+=1
            boxs.add( boxMesh );
        }else{
            object.position.z += 0.02 * speed
        }
    }
    collisionDetect(cellphoneBox)
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}
function animate() {
	renderer.setAnimationLoop( render );
}
function render() {
	renderer.render( scene, camera );
    gameLoop()
}
let postFunc = ()=>{
    scene.add(cellphoneMesh)
    initScene()
}
init(postFunc);
animate();
var button = document.createElement( 'button' );
button.id = 'ArButton'
button.textContent = 'ENTER AR' ;
button.style.cssText+= `position: absolute;top:80%;left:40%;width:20%;height:3rem;`;
document.body.appendChild(button)
document.getElementById('ArButton').addEventListener('click',x=>AR())

