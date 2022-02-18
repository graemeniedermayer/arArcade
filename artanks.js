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
function init(postFunc) {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.001, 100 );
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
// tank logic starts here
let difQuat, bullet, tank1, tank2, turret1, turret2
let isTurn = true
let startQuat = new THREE.Quaternion()
let quat180y = new THREE.Quaternion().setFromEuler(new THREE.Euler( 0, Math.PI, 0, 'XYZ' ))
let quat90x = new THREE.Quaternion().setFromEuler(new THREE.Euler( Math.PI/2, 0, 0, 'XYZ' ))
let quat90z = new THREE.Quaternion().setFromEuler(new THREE.Euler( 0, 0, Math.PI/2, 'XYZ' ))

timeScale = 0.01666 
let collisionDetect = (obj)=>{
    const position = obj.geometry.attributes.position;
	let originPoint = obj.position.clone();
    let localVertex = new THREE.Vector3();
    for (var vertexIndex = 0; vertexIndex < position.count; vertexIndex++){		
		localVertex.fromBufferAttribute( position, vertexIndex );
		var globalVertex = localVertex.applyMatrix4( obj.matrix );
		var directionVector = globalVertex.sub( obj.position );
		
		var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
		var collisionResults = ray.intersectObjects( [...tank1.children, ...tank2.children] );
		if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ){
            // check the collision
            let type = collisionResults[0].object.userData.type
			console.log(type)
            if(type=='tank2'||type=='turret2'){
                document.getElementById('result').innerHTML = 'You Win!'
				break
            }else if(type=='tank1'||type=='turret1'){
                document.getElementById('result').innerHTML = 'You Win!'
				break
            }
        } 
	}	
}
let aim = ( turret)=>{
    let diffQuat = startQuat.clone().multiply(camera.quaternion.clone().multiply(quat180y)).normalize()
    turret.quaternion.rotateTowards(diffQuat,0.5)
    // changing
}
let addTank = (color, z)=>{
    let tankTurretGeometry = new THREE.CylinderGeometry( 0.03, 0.03, .1, 32 );
    let tankTurretMaterial = new THREE.MeshBasicMaterial( { color: color } );
    let tankTurretCylinder = new THREE.Mesh( tankTurretGeometry, tankTurretMaterial );
    tankTurretCylinder.translateY(0.1)
    
    let boxGeometry = new THREE.BoxGeometry( .1, .1, .1, 1,1,1 );
    let boxMaterial = new THREE.MeshBasicMaterial( { color: color } );
    let boxMesh = new THREE.Mesh( boxGeometry, boxMaterial );
    let tank = new THREE.Group()
    tank.add(tankTurretCylinder)
    tank.add(boxMesh)
	tank.position.set(0.2*(Math.random()-0.5), -0.5, Math.random()+z)
	scene.add(tank)
    return [tankTurretCylinder, tank]
}
let addBullet = (initVel, initPos )=>{
	let bulletGeometry = new THREE.SphereGeometry( 0.02, 32, 16 );
    let bulletMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    bullet = new THREE.Mesh( bulletGeometry, bulletMaterial );
	bullet.position.set(...(initPos.toArray()) )
    bullet.userData.vel = initVel.multiplyScalar(0.05)
	scene.add(bullet)
}
let moveBullet = ()=>{
    if(bullet && bullet.position.y>-.7){
		gravConstant = 9.8/2 //tenth of gravity
        bullet.position.y += bullet.userData.vel.y * timeScale - gravConstant/2*timeScale**2
        bullet.userData.vel.y += -gravConstant*timeScale
        bullet.position.x += bullet.userData.vel.x * timeScale
        bullet.position.z += bullet.userData.vel.z * timeScale
    }else if(bullet && isTurn){
        // remove bullet]
        scene.remove(bullet)
		bullet = undefined
    } else if(bullet && !isTurn){
        // remove bullet]
        scene.remove(bullet)
		bullet = undefined
		tank2.quaternion.copy(tank1.quaternion)
		tank2.quaternion.z*=-1
		tank2.quaternion.x*=-1

		let turretDisplacement = new THREE.Vector3(0,1,0).applyQuaternion(tank2.quaternion).multiplyScalar(0.25)
		
		setTimeout(()=>{

    		let power = parseInt(document.getElementById('power').value)
        	addBullet(
				new THREE.Vector3(0,1,0).applyQuaternion(tank2.quaternion).multiplyScalar(power*(.95+0.1*Math.random())), 
				tank2.position.clone().add( turretDisplacement ))
		},500)
		isTurn =!isTurn
    }  
}


fireButton = document.getElementById('fire')
fireButton.addEventListener('click',()=>{
    let power = parseInt(document.getElementById('power').value)
	let turretDisplacement = new THREE.Vector3(0,1,0).applyQuaternion(tank1.quaternion).multiplyScalar(0.25)
    if(isTurn ){
        addBullet(
			new THREE.Vector3(0,1,0).applyQuaternion(tank1.quaternion).multiplyScalar(power), 
			tank1.position.clone().add(turretDisplacement))
		isTurn =!isTurn
    }
    isTurn = false
})
aimButton = document.getElementById('aim')
aiming = false
aimButton.addEventListener('touchstart',()=>{
    aiming = true
    startQuat = camera.quaternion.clone()
	// tank1.quaternion.clone()//.multiply(camera.quaternion.clone())
})
aimButton.addEventListener('touchend', ()=>{
    aiming = false
})  
// let aiFire = ()=>{
//     let power = parseInt(document.getElementById('power').value)
//     if(isTurn){
//         addBullet(tank1.quaternion, power, tank1.position.clone().add(new THREE.Vector3(0,1,0).applyQuaternion(tank1.quaternion)))
//     }
// }

let gameLoop = ()=>{
    if(isTurn && aiming){
        aim(tank1)
    }else{
        moveBullet()
    }
	if(bullet){
		collisionDetect(bullet)
	}
}
let postFunc = ()=>{
    [turret1, tank1] = addTank(0xffeebb,-2);
    tank1.userData.type = 'tank1';
    turret1.userData.type = 'turret1';
    [turret2, tank2] = addTank(0xbbeeff,-5);
    tank2.userData.type = 'tank2';
    turret2.userData.type = 'turret2';

}

function animate() {
	renderer.setAnimationLoop( render );
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
	animate();
})
