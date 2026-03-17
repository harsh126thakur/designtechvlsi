console.log("USERS PAGE LOADED");

window.onload = async function(){

try{

const userSnap = await getDocs(collection(db,"users"));
const courseSnap = await getDocs(collection(db,"courses"));

let courseMap = {};

courseSnap.forEach(doc=>{
courseMap[doc.id] = doc.data().title;
});

let html = "";

userSnap.forEach(docSnap=>{

const data = docSnap.data();

let courses = "None";

if(data.progress){
const ids = Object.keys(data.progress);
courses = ids.map(id => courseMap[id] || id).join(", ");
}

html += `
<tr>
<td>${data.name || "User"}</td>
<td>${data.email || ""}</td>
<td>${courses}</td>
</tr>
`;

});

document.getElementById("userTable").innerHTML = html;

}catch(err){
console.error(err);
alert("Error loading users");
}

};