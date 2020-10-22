
const err = v => {
    throw v;
}

const Task = class{
    constructor(title, isCompleted = false) {
        this.title = title; // mutable
        this.isCompleted = isCompleted; // status를 Boolean으로 관리 (비추천) --> 열거값 or 참조형 사용으로 대체
        // this.id = getUId(); // 객체지향은 객체(ref)값으로 확인, 직접 값(중복가능)으로 확인하지 않는다.
    }
    setTitle(title) {
        this.title = title;
        // return new Task(title, this.isCompleted); // immutable
    }
    // Boolean 값을 제어하는 기능은 toggle~ 사용
    toggle() {
        this.isCompleted = !this.isCompleted;
        // return new Task(this.title, !this.isCompleted); // immutable (값)
    }
    getInfo() {
        // 외부에 값을 넘길 때에는 박제해서 넘긴다.
        return {title: this.title, isCompleted: this.isCompleted};
    }
    // isEqual(task) {
    //     return task.title == this.title && task.isCompleted; // 객체 컨텍스트의 값 비교
    // }
};
(()=>{
    let isOkay = true;
    const task = new Task('test1');
    isOkay = task.getInfo().title == 'test1' && task.getInfo().isCompleted == false;
    console.log("test1", isOkay);
    task .toggle();
    isOkay = task.getInfo().title == 'test1' && task.getInfo().isCompleted == true;
    console.log("test2", isOkay);
});
const Folder = class{
    constructor(title){
        this.title = title;
        this.tasks = new Set(); // task에는 중복 값이 있을 수 없다! addTask()에서 부가적인 중복값 확인 로직을 대신하여 Collection 사용
    }
    // 1. 은닉 수준이 높은 design
    // Folder 안에 있어야하므로 task에 대한 정보는 Folder만 알고 있으면 된다.
    // 인자는 String만 넘기면 된다.
    // (-) 폴더를 옮겨야할 때 객체를 생성해야한다
    // 폴더 간 이동은 없도록 결정한 디자인!
    // removeTask()와의 대칭성 위배!
    // addTask(title){ 
    //     this.tasks.add(new Task(title)); // (-) task 생성은 folder의 책임이 아니어야 한다.
    // }
    // 2. task
    // 따라서, folder 입장에서 task의 노출은 피할 수 없다
    // task와 folder의 decoupling
    addTask(task){
        if(!(task instanceof Task)) err('invalid task'); // 강타입
        this.tasks.add(task); 
    }
    removeTask(task){
        if(!(task instanceof Task)) err('invalid task');
        this.tasks.delete(task);
    }
    getTasks(){
        return [...this.tasks.values()];
    }
    getTitle(){
        return this.title;
    }
};
(()=>{
    let isOkay = true;
    const task = new Task('test1');
    const folder = new Folder('folder1');

    isOkay = folder.getTasks().length == 0; 
    console.log("test1", isOkay);
    folder.addTask(task);
    isOkay = folder.getTasks().length == 1 && folder.getTasks()[0].getInfo().title
    == 'test1';
    console.log("test2", isOkay);
    folder.addTask(task);
    isOkay = folder.getTasks().length == 1 && folder.getTasks()[0].getInfo().title
    == 'test1';
    console.log("test3", isOkay);
});
// 도메인 구조
const App = class{
    constructor(){
        this.folders = new Set(); // App이 알아야만 하는 것들만 저장. 중복 제거
    }
    addFolder(folder){
        if(!(folder instanceof Folder)) err('invalid folder'); // 강타입
        this.folders.add(folder); 
    }
    removeFolder(folder){
        if(!(folder instanceof Folder)) err('invalid folder');
        this.folders.delete(folder);
    }
    getFolders(){
        return [...this.folders.values()];
    }
};

const Renderer = class{
    constructor(app){
        this.app = app;
    }
    render(){
        this._render();
    }
    _render(){
        err('must be overrided');
    }
};
const el = (tag)=>document.createElement(tag);
const DOMRenderer = class extends Renderer{
    constructor(parent, app){
        super(app);
        this.el = parent.appendChild(el('section'));
        this.el.innerHTML = `
            <nav>
                <input type="text">
                <ul></ul>
            </nav>
            <section>
                <header>
                    <h2></h2>
                    <input type="text">
                </header>
                <ul></ul>
            </section>
        `;
        this.el.querySelector('nav').style.cssText = 'float:left; width:200px; border-right:1px solid #000';
        this.el.querySelector('section').style.cssText = 'margin-left:210px'
        const ul = this.el.querySelectorAll('ul');
        this.folder = ul[0];
        this.task = ul[1];
        this.currentFolder = null;
        const input = this.el.querySelectorAll('input');
        input[0].addEventListener("keyup", e=>{
            if(e.keyCode != 13) return;
            const v = e.target.value.trim();
            if(!v) return; // 쉴드 패턴
            const folder = new Folder(v);
            this.app.addFolder(folder);
            e.target.value = ''; // 필수!
            this.render();
        });
        input[1].addEventListener("keyup", e=>{
            if(e.keyCode != 13 || !this.currentFolder) return;
            const v = e.target.value.trim();
            if(!v) return; // 쉴드 패턴
            const task = new Task(v);
            this.currentFolder.addTask(task);
            e.target.value = ''; // 필수!
            this.render();
        });
    }
    _render(){
        // 데이터 원본
        const folders = this.app.getFolders();
        if(!this.currentFolder) this.currentFolder = folders[0];
        this.folder.innerHTML = '';
        folders.forEach(f=>{
            const li = el('li');
            li.innerHTML = f.getTitle();
            li.style.cssText = 'font-weight:' + (this.currentFolder == f? 'bold' : 'normal');
            li.addEventListener("click", ()=>{
                this.currentFolder = f;
                this.render();
            });
            this.folder.appendChild(li);
        });
        if(!this.currentFolder) return;
        this.task.innerHTML = '';
        this.currentFolder.getTasks().forEach(t=>{
            const li = el('li');
            const {title, isCompleted} = t.getInfo();
            li.innerHTML = (isCompleted? 'Completed ' : 'process ') + title;
            li.addEventListener("click", ()=>{
                t.toggle();
                this.render();
            });
            this.task.appendChild(li);
        });
    }
};

new DOMRenderer(document.body, new App());