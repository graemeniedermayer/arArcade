let points = 0
let snakeSize = new THREE.MeshLine()
let inters = new THREE.Group()
// cellphonebox
let pixRatio = window.devicePixelRatio;
let cellphoneObj = new THREE.BoxGeometry( 
    pixRatio * screen.width * 0.0254/96,  
    pixRatio * screen.height * 0.0254/96, 0.01, 1, 1, 1)
let geo = new Float32Array(3000)
var y = pointList[lineList[i][0]];
var x = pointList[lineList[i][1]];
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
// var lineGeometry = new THREE.Geometry();
for( var j = 0; j < geo.length; j += 3 ) {
	geo[j+0] = (y[0]-x[0])*0.5*0.7*(1 - (2*j)/geo.length)+0.5*(x[0]+y[0]); 
	geo[j+1] = (y[1]-x[1])*0.5*0.7*(1 - (2*j)/geo.length)+0.5*(x[1]+y[1]); 
	geo[j+2] = (y[2]-x[2])*0.5*0.7*(1 - (2*j)/geo.length)+0.5*(x[2]+y[2]); 
}
var line = new MeshLine();
line.setGeometry( geo , function( p ) { return 20 } );
var material = new MeshLineMaterial({
	color:new THREE.Color(Math.random(),Math.random(),Math.random()),
	useMap: true,
	map: strokeTexture,
	useAlphaMap: true,
	alphaMap: strokeTexture,
	alphaTest:0.05,
	resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
	opacity: 1,
	sizeAttenuation: true,
	lineWidth: 5,
	near: camera.near,
	far: camera.far,
	blending: THREE.NormalBlending,
	transparent: true,
	repeat: new THREE.Vector2( dis/maxLength,1 )
}
);
var mesh = new THREE.Mesh( line.geometry, material ); 


let addPoint = ()=>{
    const appleGeometry = new THREE.SphereGeometry( 15, 32, 16 );
    const appleMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    const appleSphere = new THREE.Mesh( appleGeometry, appleMaterial );
    appleSphere.position(new THREE.Vector3(
        (Math.random()-0.5)*2, 
        Math.random()*2+0.3, 
        (Math.random()-0.5)*2)
    )
    return appleSphere
}
let appleSphere = addPoint()
inters.add(appleSphere)
let clearPoint = ()=>{
    scene.remove(appleSphere); 
} 
let collisionDetect = (obj)=>{
    for (var vertexIndex = 0; vertexIndex < obj.geometry.vertices.length; vertexIndex++){		
		var localVertex = obj.geometry.vertices[vertexIndex].clone();
		var globalVertex = localVertex.applyMatrix4( obj.matrix );
		var directionVector = globalVertex.sub( obj.position );
		
		var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
		var collisionResults = ray.intersectObjects( inters );
		if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ){
            // check the collision
            if(inter.object)// if its intersectioin is 
            clearPoint()
            points +=1
            appleSphere = addPoint()
            else if() // gameover
        } 
	}	
}

let moveLineForward = (meshline) => {
    let array = meshline
    
}
let gameLoop = ()=>{
    moveLineForward
    collisionDetect
}

// Thick lines threejs

// check for
