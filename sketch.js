
let points = [];
let num_points = 500;
let mesh;

let img;
let fing;

let num_points_slider, background_color_selector, save_bottom, load_file_bottom;

function area(vertices) {
  let a = 0;
  for (let i = 0; i < vertices.length; i++) {
    a += vertices[i].x * vertices[(i + 1) % vertices.length].y -
      vertices[(i + 1) % vertices.length].x * vertices[i].y
  }
  return a * 0.5;
}

function centroid(vertices, a) {
  if (!a) {
    a = area(vertices);
  }

  let x_bar = 0;
  let y_bar = 0;
  for (let i = 0; i < vertices.length; i++) {
    let b = vertices[i].x * vertices[(i + 1) % vertices.length].y -
      vertices[(i + 1) % vertices.length].x * vertices[i].y
    x_bar += (vertices[i].x + vertices[(i + 1) % vertices.length].x) * b;
    y_bar += (vertices[i].y + vertices[(i + 1) % vertices.length].y) * b;
  }
  let norm = 1 / (6 * a);
  return [norm * x_bar, norm * y_bar];
}

function second_moment(vertices, a) {
  if (!a) {
    a = area(vertices);
  }
  let axx = 0;
  let ayy = 0;
  let axy = 0;
  for (let i = 0; i < vertices.length; i++) {
    let b = vertices[i].x * vertices[(i + 1) % vertices.length].y -
      vertices[(i + 1) % vertices.length].x * vertices[i].y
    axx += (vertices[i].x ** 2 + vertices[i].x * vertices[(i + 1) % vertices.length].x + vertices[(i + 1) % vertices.length].x ** 2) * b;
    ayy += (vertices[i].y ** 2 + vertices[i].y * vertices[(i + 1) % vertices.length].y + vertices[(i + 1) % vertices.length].y ** 2) * b;
    axy += (2 * vertices[i].x * vertices[i].y +
      vertices[i].x * vertices[(i + 1) % vertices.length].y +
      vertices[i].y * vertices[(i + 1) % vertices.length].x +
      2 * vertices[(i + 1) % vertices.length].x * vertices[(i + 1) % vertices.length].y) * b;
  }
  let norm = 1 / (12 * a);
  return [norm * axx, norm * ayy, 0.5 * norm * axy];
}

function drawArrow(base, vec, myColor) {
  push();
  stroke(myColor);
  strokeWeight(3);
  fill(myColor);
  translate(base.x, base.y);
  line(0, 0, vec.x, vec.y);
  rotate(vec.heading());
  let arrowSize = 7;
  translate(vec.mag() - arrowSize, 0);
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pop();
}

function drawPolygon(vertices) {
  beginShape();
  for (let v of vertices) vertex(v.x, v.y);
  endShape(CLOSE);
}

function fit_ellipse(vertices) {

  let A = area(vertices);

  [ax, ay] = centroid(vertices, A);
  [axx, ayy, axy] = second_moment(vertices, A);
  mu_xx = axx - ax ** 2;
  mu_yy = ayy - ay ** 2;
  mu_xy = axy - ax * ay;

  cov = math.matrix([[mu_yy, -mu_xy], [-mu_xy, mu_xx]]);
  cov = math.map(cov, elem => elem * (1 / (4 * (mu_xx * mu_yy - mu_xy ** 2))));
  // console.log(cov);
  decomp = math.eigs(cov);
  // console.log(decomp);

  v1 = createVector(decomp.eigenvectors[0].vector._data[0], decomp.eigenvectors[0].vector._data[1]).mult(1 / Math.sqrt(decomp.values._data[0]));
  v2 = createVector(decomp.eigenvectors[1].vector._data[0], decomp.eigenvectors[1].vector._data[1]).mult(1 / Math.sqrt(decomp.values._data[1]));

  return [v1, v2, createVector(ax, ay)];
}

function calculate_regions() {
  points = [];
  for (let i = 0; i < num_points; i++) {
    points.push(new c2.Point(random(width), random(height)));
  }

  mesh = new c2.Voronoi();
  mesh.compute(points);

}

function load_new_img(event) {
  let file = event.target.files[0];
  let reader = new FileReader();
  reader.onload = () => {
    // console.log(reader.result);
    loadImage(reader.result, (img_local) => {
      img = img_local;
      width = img.width;
      height = img.height;
      resizeCanvas(width, height);
      calculate_regions();
      draw();
    });
  }

  reader.readAsDataURL(file);

}

function preload() {
  img = loadImage('francis_crop_big.jpg');
  fing = loadImage('Fingerprint_picture.png')
}

function setup() {

  createCanvas(img.width, img.height, document.getElementById("canvas"));

  background_color_selector = document.getElementById("background-color");
  background_color_selector.onchange = (ev) => {
    draw();
  }

  num_points_slider = document.getElementById("num-points");
  num_points_slider.onmouseup = (ev) => {
    num_points = num_points_slider.value;
    calculate_regions();
    draw();
  }

  save_bottom = document.getElementById("save");
  save_bottom.onclick = (ev) => save('frame.png');

  calculate_regions();

  imageMode(CENTER);
  ellipseMode(CENTER);
  noLoop();
}

function draw() {
  let c = background_color_selector.value
  background(c);

  for (let p of mesh.regions) {
    let [v1, v2, c] = fit_ellipse(p.vertices);
    fill(img.get(c.x, c.y));
    // drawPolygon(p.vertices);
    push();
    stroke(0);
    translate(c.x, c.y);
    rotate(v1.heading());
    tint(img.get(c.x, c.y));
    image(fing, 0, 0, 2 * v1.mag(), 2 * v2.mag());
    // ellipse(0, 0, v1.mag(), v2.mag());
    pop();
  }

}

