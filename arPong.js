var camera, scene, renderer;
points1 = 0;
points2 = 0;
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
function init(postFunc) {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.001, 20 );
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.xr.enabled = true;
	document.body.appendChild( renderer.domElement );
	window.addEventListener( 'resize', onWindowResize, false );
    postFunc()
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
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}


let addBox = (geo, color, pos)=>{
    let boxMaterial = new THREE.MeshBasicMaterial( { color: color } );
    let boxMesh = new THREE.Mesh( geo, boxMaterial );
    boxMesh.position.set(...(pos.toArray())) 
    return boxMesh
}
let currentVel = new THREE.Vector3(0,0,0)
let instantVel1 = new THREE.Vector3()
let instantVel2 = new THREE.Vector3()
let ballSphere
let dt = 0.01

let bounce = (paddleVel)=>{
    currentVec.z*=-1
    // currentVec.x += 0.1* paddleVel.x
    // currentVec.y += 0.1* paddleVel.y
    ballSphere.position.x += dt* currentVel.x
    ballSphere.position.y += dt* currentVel.y
    ballSphere.position.z += dt* currentVel.z
}

let wallBounce= (reflect)=>{
    
    if(reflect == 'x'){
        currentVel.x*=-1
    }
    if(reflect == 'y'){
        currentVel.y*=-1
    }
    ballSphere.position.x += dt* currentVel.x
    ballSphere.position.y += dt* currentVel.y
    ballSphere.position.z += dt* currentVel.z
}
let clearPoint = ()=>{
    scene.remove(ballSphere)
}
let addPoint = ()=>{

    let ballGeometry = new THREE.SphereGeometry( 0.1, 32, 16 );
    let ballMaterial = new THREE.MeshBasicMaterial( { color: 0xff00ff } );
    ballSphere = new THREE.Mesh( ballGeometry, ballMaterial );
    let theta = Math.PI*2*Math.random()
    let dir = Math.random()>0.5 ? 1 : -1
    let initVel = 1
    ballSphere.position.set(
        dt*initVel* Math.cos(theta), 
        dt*initVel* Math.sin(theta), 
        dt*initVel* dir-2
    )
	currentVel = new THREE.Vector3(
        initVel* Math.cos(theta), 
        initVel* Math.sin(theta), 
        initVel* dir)
	scene.add(ballSphere)
	return ballSphere
}
let collisionDetect = (obj)=>{
    const position = obj.geometry.attributes.position;
	let originPoint = obj.position.clone();
    let localVertex = new THREE.Vector3();
    for (var vertexIndex = 0; vertexIndex < position.count; vertexIndex++){		
		localVertex.fromBufferAttribute( position, vertexIndex );
		var globalVertex = localVertex.applyMatrix4( obj.matrix );
		var directionVector = globalVertex.sub( obj.position );
		
		var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
		var collisionResults = ray.intersectObjects( inters.children );
		if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ){
            // check the collision
            let type = collisionResults[0].object.userData.type
            if(type=='goal1'){
                clearPoint()
                points1 += 1
				document.getElementById('score1').innerHeight = points1
                appleSphere = addPoint()
				break
            }else if(type=='goal2'){
                clearPoint()
                points2 += 1
				document.getElementById('score2').innerHeight = points2
                appleSphere = addPoint()
				break
            }else if(type=='player1' || type=='player2'){
                // bounce(collisionResults[0].userData.instantVel)
				bounce(1)
				break
            }else if(type=='walls'){
                // vertex re
				
                wallBounce( Math.abs(directionVector.x) > Math.abs(directionVector.y) ? 'x' : 'y')
				break
            }
			
        } 
	}	
}

let Player1 = addBox(
    new THREE.BoxGeometry( .2, .2, .05, 1,1,1 ), 
    new THREE.Color(`rgba(0,0,255,0.9)`), 
    new THREE.Vector3(0,0,-.3))
Player1.userData['type']= 'player1'
Player1.userData['instantVel']= instantVel1
Player1.material.wireframe = true
let Player2 = addBox(
    new THREE.BoxGeometry( .2, .2, .05, 1,1,1 ), 
    new THREE.Color(`rgba(0,100,0,0.9)`), 
    new THREE.Vector3(0,0,-3.7))
Player2.userData['type']= 'player2'
Player2.userData['instantVel']= instantVel2
Player2.material.wireframe = true
let Goal2 = addBox(
    new THREE.BoxGeometry( 3, 3, .4, 1,1,1 ), 
    new THREE.Color(`rgba(0,255,0,0.5)`), 
    new THREE.Vector3(0,0,-4.1))
Goal2.userData['type']= 'goal2'
Goal2.material.wireframe = true
let Goal1 = addBox(
    new THREE.BoxGeometry( 3, 3, .4, 1,1,1 ), 
    new THREE.Color(`rgba(0,0,255,0.5)`), 
    new THREE.Vector3(0,0,0.1))
Goal1.userData['type']= 'goal1'
Goal1.material.wireframe = true
let Walls = addBox(
    new THREE.BoxGeometry( 3, 3, 4.4, 1,1,1 ), 
    new THREE.Color(`rgba(0,255,255,0.2)`), 
    new THREE.Vector3(0,0,-2.1))
Walls.userData['type'] = 'walls'
Walls.material.side = THREE.BackSide
Walls.material.wireframe = true
inters = new THREE.Group()
inters.add(Player1)
inters.add(Player2)
inters.add(Goal1)
inters.add(Goal2)
inters.add(Walls)
// websocket

let updatePos = (obj, cursor) => {
    obj.position.x = cursor.x
    obj.position.y = cursor.y
    obj.needsUpdate = true
}

let aiMove = (ball, userCursor) => {
    aiScale = 0.1
    userCursor.x += (ball.x - userCursor.x) * aiScale
    userCursor.y += (ball.y - userCursor.y) * aiScale
}

let gameLoop = ()=>{
	if(ballSphere){
    	collisionDetect(ballSphere)
    	aiMove(ballSphere.position, Player2.position)
    	ballSphere.position.x += dt* currentVel.x
    	ballSphere.position.y += dt* currentVel.y
    	ballSphere.position.z += dt* currentVel.z
    	ballSphere.needsUpdate = true
	}
    Player1.position.x = camera.position.x 
    Player1.position.y = camera.position.y 

}

function animate() {
	renderer.setAnimationLoop( render );
}
function render() {
	renderer.render( scene, camera );
    gameLoop()
}
let postFunc = ()=>{
    scene.add(inters)
    appleSphere = addPoint()
}
init(postFunc);
var button = document.createElement( 'button' );
button.id = 'ArButton'
button.textContent = 'ENTER AR' ;
button.style.cssText+= `position: absolute;top:80%;left:40%;width:20%;height:3rem;`;
document.body.appendChild(button)
document.getElementById('ArButton').addEventListener('click',x=>{
	AR()
	animate()
})
