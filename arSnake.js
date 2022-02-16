var camera, scene, renderer;
var strokeTexture, snakeMesh, appleSphere;
// var loader = new THREE.GLTFLoader()
// loader.load( '/static/eave/experiment/thread4.png', function( texture ) {
// 	strokeTexture = texture;
// 	strokeTexture.wrapS = strokeTexture.wrapT = THREE.RepeatWrapping; 
//     init(postFunc);
// } );
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
function animate() {
	renderer.setAnimationLoop( render );
}


let points = 0
let snakeSize = new MeshLine()
let inters = new THREE.Group()
let instVel, instPos, lastPos
// cellphonebox
let pixRatio = window.devicePixelRatio;
let cellphoneObj = new THREE.BoxGeometry( 
    screen.width * 0.0254/(40*pixRatio),  
    screen.height * 0.0254/(40*pixRatio), 0.01, 1, 1, 1)
let cellMaterial = new THREE.MeshBasicMaterial( { color: 0x444444 } );
let cellMesh = new THREE.Mesh( cellphoneObj, cellMaterial );
cellMesh.visible= false
cellMesh.material.wireframe = true
let geo = new Float32Array(3000)
let snakePos = []
let snakeVec = []
let cubicBezier = (p0,p1,p2,p3) => {
    return (t)=>{
        return (1-t)**3*p0 + 3*(1-t)**2*t*p1 + 3*(1-t)*t**2*p2 + t**3*p3
    }
}
let changeLine = (listOfPoints, listOfVecs) => {
    let maxLength = listOfPoints.length
    let iterLength = maxLength*10
    for( var j = 0; j < maxLength-1; j += 3 ) {
        let points1 = listOfPoints[j]
        let points2 = listOfPoints[j+1]
        let vecs1 = listOfVecs[j]
        let vecs2 = listOfVecs[j+1]
        let x = cubicBezier(points1[0], points1[0]+vecs1[0], points2[0]-vecs2[0], points2[0])
        let y = cubicBezier(points1[1], points1[1]+vecs1[1], points2[1]-vecs2[1], points2[0])
        let z = cubicBezier(points1[2], points1[2]+vecs1[2], points2[2]-vecs2[2], points2[0])
        for(let k = 0; k <10; k++){
            geo[10*j + k + 0] = x(0.1*k)
            geo[10*j + k + 1] = y(0.1*k)
            geo[10*j + k + 2] = z(0.1*k)
        }
    }
    snakeMesh.geometry.setDrawRange(0, iterLength)
    snakeMesh.geometry.needsUpdate = true
}
let makeMeshLine = (listOfPoints)=>{
    let canvas = document.createElement('canvas');
    canvas.width = 52;
    canvas.height= 52;
    let el = document.createElement('div');
    // el.style.position
    el.style.cssText +=';'+ 'position:absolute;top:0px;z-index:-2;height:10px;width:10px;';
    el.appendChild(canvas)
    document.body.appendChild(el)
    let ctx = canvas.getContext('2d');
    let grd = ctx.createLinearGradient(0, 0, 50, 0);
    grd.addColorStop(0, "red");
    grd.addColorStop(1, "white")
    // Fill with gradient
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height );
    let colortexture = new THREE.Texture( canvas ) ;
    var line = new MeshLine();
    line.setGeometry( geo , function( p ) { return 20 } );
    var material = new MeshLineMaterial({
    	color:new THREE.Color(Math.random(),Math.random(),Math.random()),
    	useMap: true,
    	useAlphaMap: true,
        wireframe: true,
    	alphaTest:0.05,
    	resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    	opacity: 1,
    	sizeAttenuation: true,
    	lineWidth: 5,
    	near: camera.near,
    	far: camera.far,
    	blending: THREE.NormalBlending,
    	transparent: true,
    	repeat: new THREE.Vector2( 1,1 )
    }
    );
    var mesh = new THREE.Mesh( line.geometry, material ); 
    return mesh
}
let addPoint = ()=>{
    const appleGeometry = new THREE.SphereGeometry( 0.1, 32, 16 );
    const appleMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    appleSphere = new THREE.Mesh( appleGeometry, appleMaterial );
    appleSphere.position.set(
        (Math.random()-0.5), 
        Math.random()-0.3, 
        -(Math.random()))
    appleSphere.userData.type= 'apple'
    return appleSphere
}
appleSphere = addPoint()
inters.add(appleSphere)
let gainPoint = ()=>{
    scene.remove(appleSphere); 
    snakePos.push(instPos)
    snakeVec.push(instVel)
    changeLine(snakePos, snakeVec)
} 
let restartSnake = ()=>{
    snakePos = []
    snakeVec = []
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
            console.log(collisionResults[0].object)
            if(collisionResults[0].object.userData.type == 'apple'){// if its intersectioin is 
                gainPoint()
                points +=1
                document.getElementById('score').innerHTML = points
                appleSphere = addPoint()
                break
            }else{// gameover
                // points = 0
                // restartSnake()
                // document.getElementById('score').innerHTML = points
            } 
        } 
	}	
}

let moveLineForward = (newPoint, newVel) => {
    snakePos.splice(0,1)
    snakePos.push(newPoint)
    snakeVec.splice(0,1)
    snakeVec.push(newVel)
    changeLine(snakePos, snakeVec)
}
counts = 0
lastPos = [0,0,0]
pointThreshold = 0.15
let magnitude = (p1, p2)=>{
    return Math.sqrt( (p1[0]-p2[0])**2 + (p1[1]-p2[1])**2 + (p1[2]-p2[2])**2 )
}
let gameLoop = ()=>{
    collisionDetect(cellMesh)
    counts += 1
    instPos = camera.position.toArray()
    instVel = instPos.map((x,i)=> 0.02*(lastPos[i]-x)) 
    if(pointThreshold < magnitude(snakePos[snakePos.length-1], instPos) ){
        moveLineForward(instPos, instVel)
    }
    lastPos = instPos
    cellMesh.position.copy(camera.position)
}

function postFunc(){
    snakeMesh = makeMeshLine()
    snakeMesh.userData.type = 'snake'
    inters.add(snakeMesh)
    scene.add(cellMesh)
    scene.add(inters)
} 

function render() {
	renderer.render( scene, camera );
    gameLoop()
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
