function loadCalculator() {

  const html = `
  <div id="calcBtn">🧮</div>

  <div id="gateCalc">
    <div id="calcHeader">
      <span id="mode">DEG</span>
      <span>Calculator</span>
      <button id="invBtn">INV</button>
    </div>

    <input id="display" readonly />

    <div class="grid">

      <!-- Row 1 -->
      <button data-func="sin">sin</button>
      <button data-func="cos">cos</button>
      <button data-func="tan">tan</button>
      <button id="back">←</button>

      <!-- Row 2 -->
      <button data-func="log">log</button>
      <button data-func="ln">ln</button>
      <button data-val="sqrt(">√</button>
      <button data-val="^">xʸ</button>

      <!-- Row 3 -->
      <button data-val="(">(</button>
      <button data-val=")">)</button>
      <button data-val="pi">π</button>
      <button data-val="e">e</button>

      <!-- Row 4 -->
      <button data-val="7">7</button>
      <button data-val="8">8</button>
      <button data-val="9">9</button>
      <button data-val="/">÷</button>

      <!-- Row 5 -->
      <button data-val="4">4</button>
      <button data-val="5">5</button>
      <button data-val="6">6</button>
      <button data-val="*">×</button>

      <!-- Row 6 -->
      <button data-val="1">1</button>
      <button data-val="2">2</button>
      <button data-val="3">3</button>
      <button data-val="-">−</button>

      <!-- Row 7 -->
      <button data-val="0">0</button>
      <button data-val=".">.</button>
      <button id="equals">=</button>
      <button data-val="+">+</button>

      <!-- Row 8 -->
      <button id="modeToggle">DEG/RAD</button>
      <button id="clear">C</button>

    </div>
  </div>
  `;

  const style = `
  <style>
  #calcBtn{
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #2563eb;
    color: white;
    border-radius: 50%;
    padding: 12px;
    cursor: pointer;
    z-index: 9999;
  }

  #gateCalc{
    position: fixed;
    top: 100px;
    right: 40px;
    width: 260px;
    background: #0a0f1a;
    border-radius: 4px;
    display: none;
    box-shadow: 0 5px 20px rgba(0,0,0,0.7);
    user-select: none;
    font-family: Arial;
  }

  #calcHeader{
    background: #1f2937;
    color: white;
    padding: 5px;
    display: flex;
    justify-content: space-between;
    cursor: move;
    font-size: 11px;
  }

  #display{
    width: 100%;
    height: 36px;
    background: #000;
    color: #00ff88;
    border: none;
    padding: 5px;
    font-size: 14px;
  }

  .grid{
    display: grid;
    grid-template-columns: repeat(4,1fr);
    gap: 3px;
    padding: 5px;
  }

  button{
    padding: 7px;
    background: #1f2937;
    color: white;
    border: none;
    font-size: 11px;
    border-radius: 2px;
  }

  button:hover{
    background: #374151;
  }

  #equals{
    background: #2563eb;
  }

  #clear{
    grid-column: span 2;
    background: #7f1d1d;
  }

  #modeToggle{
    grid-column: span 2;
  }

  </style>
  `;

  document.body.insertAdjacentHTML("beforeend", style + html);
  initCalculator();
}

function initCalculator(){

  let isInv = false;
  let isDeg = true;

  const calc = document.getElementById("gateCalc");
  const display = document.getElementById("display");
  const modeText = document.getElementById("mode");

  document.getElementById("calcBtn").onclick = () => {
    calc.style.display = calc.style.display === "none" ? "block" : "none";
  };

  // Numbers & operators
  document.querySelectorAll("[data-val]").forEach(btn=>{
    btn.onclick = ()=> display.value += btn.dataset.val;
  });

  // Functions
  document.querySelectorAll("[data-func]").forEach(btn=>{
    btn.onclick = ()=>{
      let name = btn.dataset.func;

      if(isInv){
        if(name==="sin") display.value += "asin(";
        else if(name==="cos") display.value += "acos(";
        else if(name==="tan") display.value += "atan(";
      } else {
        display.value += name+"(";
      }
    };
  });

  // Backspace
  document.getElementById("back").onclick = ()=>{
    display.value = display.value.slice(0,-1);
  };

  // Equals
  document.getElementById("equals").onclick = ()=>{
    try{
      let expr = display.value;

      if(isDeg){
        expr = expr.replace(/sin\((.*?)\)/g, "sin(($1)*pi/180)");
        expr = expr.replace(/cos\((.*?)\)/g, "cos(($1)*pi/180)");
        expr = expr.replace(/tan\((.*?)\)/g, "tan(($1)*pi/180)");
      }

      display.value = math.evaluate(expr);
    }catch{
      display.value = "Error";
    }
  };

  // Clear
  document.getElementById("clear").onclick = ()=> display.value="";

  // Mode
  document.getElementById("modeToggle").onclick = ()=>{
    isDeg=!isDeg;
    modeText.innerText = isDeg ? "DEG":"RAD";
  };

  // INV toggle
  document.getElementById("invBtn").onclick = ()=>{
    isInv=!isInv;

    // Change button labels visually
    document.querySelectorAll("[data-func]").forEach(btn=>{
      let name = btn.dataset.func;
      if(isInv){
        if(name==="sin") btn.innerText="sin⁻¹";
        if(name==="cos") btn.innerText="cos⁻¹";
        if(name==="tan") btn.innerText="tan⁻¹";
      } else {
        btn.innerText=name;
      }
    });
  };

  // Drag
  let isDragging=false,offsetX,offsetY;
  const header=document.getElementById("calcHeader");

  header.addEventListener("mousedown",(e)=>{
    isDragging=true;
    offsetX=e.clientX-calc.offsetLeft;
    offsetY=e.clientY-calc.offsetTop;
  });

  document.addEventListener("mousemove",(e)=>{
    if(isDragging){
      calc.style.left=(e.clientX-offsetX)+"px";
      calc.style.top=(e.clientY-offsetY)+"px";
    }
  });

  document.addEventListener("mouseup",()=> isDragging=false);
}