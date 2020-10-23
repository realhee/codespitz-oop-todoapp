
const err = v => {
    throw v;
}

const Task = class{
    static get(title) {return new Task (title);} // Factory pattern
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
const Folder = class extends Set{ // folder is Set
    constructor(title){
        super();
        this.title = title;
    }
    // 어떤 메소드가 어떤 객체에 들어가야 하는지 애매할 땐 아래와 같이 대입해보면 된다.
    // ex - App은 task 정보를 알 필요가 없다. 의존성이 늘어나면 잘못된 위치!
    moveTask(task, folderSrc, folderDest) {
        if(super.has(task) || !folderSrc.has(task)) throw err('.');
        folderSrc.removeTask(task);
        this.addTask(task);
    } // replace, move, remove & add
    addTask(task){
        if(!(task instanceof Task)) err('invalid task'); // 강타입
        this.tasks.add(task);
        super.add(task);
    }
    removeTask(task){
        if(!(task instanceof Task)) err('invalid task');
        super.delete(task);
    }
    getTasks(){ 
        return [...super.values()];
    }
    getTitle(){
        return this.title;
    }
    // 내적 동질성의 원리
    add(){} delete(){err('...');} clear(){} values(){} 
};
// 도메인 구조
const App = class extends Set{
    static get(title) {return new Folder(title);} // Factory pattern
    constructor(){
        super();
    }
    addFolder(folder){
        if(!(folder instanceof Folder)) err('invalid folder'); // 강타입
        super.add(folder); 
    }
    removeFolder(folder){
        if(!(folder instanceof Folder)) err('invalid folder');
        super.delete(folder);
    }
    getFolders(){
        return [...super.values()];
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
        const [folder, task] = Array.from(document.querySelectorAll('ul'));
        this.folder = folder;
        this.task = task;
        this.currentFolder = null;
        parent.querySelector('nav>input').addEventListener("keyup", e=>{
            if(e.keyCode != 13) return;
            const v = e.target.value.trim();
            if(!v) return; // 쉴드 패턴
            const folder = Folder.get(v);  
            this.app.addFolder(folder);
            e.target.value = ''; // 필수!
            this.render();
        });
        parent.querySelector('header>input').addEventListener("keyup", e=>{
            if(e.keyCode != 13 || !this.currentFolder) return;
            const v = e.target.value.trim();
            if(!v) return; // 쉴드 패턴
            const task = Task.get(v);
            this.currentFolder.addTask(task);
            e.target.value = ''; // 필수!
            this.render();
        });
    }
    _render(){
        // 데이터 원본
        const folders = this.app.getFolders();
        let moveTask, tasks;
        if(!this.currentFolder) this.currentFolder = folders[0];
        let oldEl = this.folder.firstElementChild, lastEl;
        folders.forEach(f=>{
            let li;
            if(oldEl) {
                li = oldEl;
                oldEl = oldEl.nextElementSibling;
            } else {
                li = el('li');
                this.folder.appendChild(li);
                oldEl = null;
            }
            lastEl = li;
            li.innerHTML = f.getTitle();
            li.style.cssText = 'font-weight:' + (this.currentFolder == f? 'bold' : 'normal');
            li.onclick = ()=>{
                this.currentFolder = f;
                this.render();
            };
            li.ondrop = e=>{
                e.preventDefault();
                f.moveTask(moveTask, this.currentFolder, t);
            };
            li.ondragover = e=>{
                e.preventDefault();
            };
        });
        if(lastEl)
        while(oldEl = lastEl.nextElementSibling) {
            this.folder.removeChild(oldEl);
        }
        if(!this.currentFolder) return;
        tasks = this.currentFolder.getTasks();
        if(tasks.length == 0) {
            while(oldEl == this.task.firstElementChild) {
                this.task.removeChild(oldEl);
            }
        } else {
            oldEl = this.task.firstElementChild, lastEl = null;
            tasks.forEach(t=>{
            let li;
            if(oldEl) {
                li = oldEl;
                oldEl = oldEl.nextElementSibling;
            } else {
                li = this.taskEl.length? this.taskEl.pop() : el('li'); // 증분 렌더링 구현
                this.task.appendChild(li);
                oldEl = null;
            }
            lastEl = li;
            const {title, isCompleted} = t.getInfo();
            li.setAttribute('draggable', true);
            li.innerHTML = (isCompleted? 'Completed ' : 'process ') + title;
            li.addEventListener("click", e=>{
                t.toggle();
                this.render();
            });
            li.addEventListener("dragstart", e=>{
                moveTask = t;
            });
            if(lastEl)
                while(oldEl == lastEl.nextElementSibling) {
                    this.task.removeChild(oldEl);
                    this.taskEl.push(oldEl);
                }
        });
    }
};

new DOMRenderer(document.querySelector('main'), new App());