let myP = document.getElementById('myP');
myP.innerHTML =  'I have been changed';
let myBtnTwo = document.getElementById('myBtnTwo');
let myDiv = document.getElementById('error');
let divBtn = document.getElementById('divBtn');
let divContainer = document.getElementById('container');
let ul = document.getElementById('list');

function btnClick() {
    if(myP.className === 'myClassOne') {
        myP.className = 'myClassTwo';
        mP.innerHTML = 'I am now class two';
    } else {
        myP.className = 'myClassOne';
        myP.innerHTML = 'I am now class one';
    }
}

myBtnTwo.addEventListener('click', () => {
    // alert('btn two has been clicked');

    if (myDiv.hidden == true){
        myDiv.hidden = false;
    }else {
        myDiv.hidden = true;
    }
});

divBtn.addEventListener('click', () => {
    let newP = document.createElement('p');
    newP.innerHTML = "'I'am another P tag";
    divContainer.appendChild(newP);
    
});

function addItem() {
    let li = document.createElement('li');
    li.innerHTML = 'I am a new list item';
    ul.appendChild(li);
}

