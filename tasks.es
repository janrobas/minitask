// react
  // ...

var React = require('react');
var ReactDOM = require('react-dom');

var keySubscribers = {};

var TaskState = {
  BACKLOG: 0,
  TODO: 1,
  WIP: 2,
  DONE: 3,
};

class Task extends React.Component {
  constructor() {
    super();
  }

  render() {
    return(
      <div className={"task" + (this.props.taskObj.displace ? ' displace' : '') + (this.props.taskObj.to_be_moved ? ' moving-task' : '')} onDrop={(e) => this.props.onDrop(e, this.props.taskObj)} onDragOver={(e)=>this.props.onDragOver(e)} draggable="true" onDragEnter={(e) => this.props.onDragEnter(e, this.props.taskObj)} onDragLeave={(e) => this.props.onDragLeave(e, this.props.taskObj)} onDragEnd={(e) => this.props.onDragEnd(e)} onDragStart={(e) => this.props.onDragStart(e, this.props.taskObj)}>
        <div className="title">{this.props.taskObj.title}</div>
        <div className="description">{this.props.taskObj.description}</div>
        <button onClick={() => this.props.editTask()}>Edit</button>
      </div>
    )
  }
}

class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.state={title: props.task.title, description: props.task.description, id: props.task.id, important: !!props.task.important};
  }
  handleChangeTitle(event) {
    this.setState({title: event.target.value});
  }
  handleChangeDescription(event) {
    this.setState({description: event.target.value});
  }
  handleChangeImportance(event) {
    this.setState({important: event.target.checked});
  }
  handleKeyShortcuts(e) {
    if (e.keyCode == 13 && e.ctrlKey) {
      this.props.handleUpdate(this.state.id, this.state.title, this.state.description, this.state.important);
    }
  }
  componentDidMount() {
    keySubscribers["editor"] = this.handleKeyShortcuts.bind(this);
    this.titleInput.focus();
    this.titleInput.selectionStart = this.titleInput.selectionEnd = this.titleInput.value.length;
  }
  componentWillUnmount() {
    delete keySubscribers["editor"];
  }
  render() {
    return(<div className="overlay">
      <div className="center"><input ref={(input) => { this.titleInput = input; }}  className="title" value={this.state.title} onChange={(e) => this.handleChangeTitle(e)} /></div>
      <div className="center"><textarea className="description" onChange={(e) => this.handleChangeDescription(e)} value={this.state.description}></textarea></div>
      <div className="center"><label><input type="checkbox" checked={this.state.important} onChange={(e) => this.handleChangeImportance(e)} /> Important</label></div>
      <div className="center edit-actions"><button type="button" onClick={() => this.props.handleUpdate(this.state.id, this.state.title, this.state.description, this.state.important)}>OK</button><button type="button" onClick={() => this.props.cancel()}>Cancel</button></div>
    </div>);
  }
}

class Table extends React.Component {
  constructor()  {
    super();

    this.state = {
      tasks: [
        /*{id:1, title:"lol", state:TaskState.TODO, description:"tole je en navadn test, samo da testiram, kako dela overflow pa takle -- da ni tprslfejsdkfjhsdlkfjsdf", order:1},
        {id:2, title:"jan", state:TaskState.TODO, description:"a", order:2},
        {id:3, title:"robas", state:TaskState.WIP, description:"a", order:1},
        {id:4, title:"robas2", state:TaskState.DONE, description:"a", order:1}*/
        ],
      dragged: null,
      editing: null
    };
  }
  changeHappened() {
    window.dispatchEvent(new CustomEvent('change-happened'));
  }
  moveTask(a, b) {
    // we put the task in place of previous task
    a.order = b.order;
    a.state = b.state;

    // we increment the order of all tasks below
    this.state.tasks.filter(x=>x.id != a.id && x.state == b.state && x.order >= b.order).forEach(x => x.order++);
    this.changeHappened();
  }
  moveTaskState(a, state) {
    a.state = state;
    // we put the task at the end
    a.order = 1+this.state.tasks.map(x=>x.order).reduce((a,x)=>Math.max(a,x));
    this.changeHappened();
  }
  handleDrop(e, task) {
    this.moveTask(this.state.dragged, task);
    this.reset();

    //this.state.dragged = null;

    if(e.stopPropagation) {
      e.stopPropagation();
    }

    this.refresh();
  }
  handleDropColumn(state) {
    if(!this.state.dragged)
      return;

    this.moveTaskState(this.state.dragged, state);
    this.reset();
    this.refresh();
  }
  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }

    return false;
  }
  handleDragEnter(e, task) {
    task.displace = true;
    this.refresh();
  }
  handleDragLeave(e, task) {
    task.displace = false;
    this.refresh();
  }
  handleDragEnd() {
    this.reset();
    this.refresh();
  }
  handleDragStart(e, task) {
    task.to_be_moved = true;

    this.setState({
      dragged: task
    });

    //e.dataTransfer.setData('text/html', this.innerHTML);
    e.dataTransfer.setData('text/html', task.id);
  }
  reset() {
    this.state.tasks.forEach(x => x.displace = false);
    this.state.tasks.forEach(x => x.to_be_moved = false);
    this.setState({
      dragged: null
    });
  }
  refresh() {
    this.forceUpdate();
  }
  handleUpdate(id, title, description, important) {
    if(!title) {
      alert("Title is required.");
      return;
    }

    this.state.editing.title=title;
    this.state.editing.description=description;
    this.state.editing.important=important;

    // if we don't have an id, this means we have to create a new task with new id
    if(!id) {
      // new task
      var maxTaskId = 0;
      var maxOrder = 0;

      if(this.state.tasks.length > 0) {
        maxTaskId = (this.state.tasks.map(x=>x.id).reduce((a,x) => Math.max(a,x)));
      }

      var tasksForSelectedState=this.state.tasks.filter(x => x.state == this.state.editing.state);
      if(tasksForSelectedState.length > 0) {
        maxOrder = tasksForSelectedState.map(x=>x.order).reduce((a,x) => Math.max(a,x));
      }

      this.state.editing.id=maxTaskId+1;
      this.state.editing.order=maxOrder+1;
      this.setState({
        tasks: this.state.tasks.concat(this.state.editing)
      });
    }

    this.setState({
      editing: null
    });
    this.changeHappened();
  }
  cancelEdit() {
    this.setState({
      editing: null
    });
  }
  editTask(task) {
    this.setState({
      editing: task
    });
  }
  deleteTask(task) {
    this.setState({
      tasks: this.state.tasks.filter(x=>x.id != task.id)
    });
    this.changeHappened();
  }
  deleteDraggedTask() {
    this.deleteTask(this.state.dragged);
    this.reset();
    this.changeHappened();
  }
  newTask() {
    this.setState({
      editing: {title:"", state:TaskState.BACKLOG, description:"", order:1}   // default parameters for new task
    });    
  }
  createTask(task) {
    return (
        <Task style="order: {task.order};" taskObj={task} key={task.id} title={task.title} onDragEnter={(e) => this.handleDragEnter(e, task)} onDragLeave={(e) => this.handleDragLeave(e, task)} onDrop={(e) => this.handleDrop(e, task)} onDragOver={(e) => this.handleDragOver(e)} onDragEnd={(e) => this.handleDragEnd(e)} onDragStart={(e) => this.handleDragStart(e, task)} editTask={() => this.editTask(task)} deleteTask={() => this.deleteTask(task)} />
      );
  }
  getTasks(taskState) {
    return this.state.tasks.filter(x => x.state == taskState).sort((a,b) => a.order - b.order).map(task => this.createTask(task));
  }
  createEditor() {
    return(<Editor task={this.state.editing} handleUpdate={(id, title, description, important) => this.handleUpdate(id, title, description, important)} cancel={() => this.cancelEdit()} />);
  }
  handleKeyShortcuts(e) {
    var keycode = e.keyCode;

    // any key letter or number without modifiers
    var validText =
    !e.ctrlKey &&
    ((keycode > 47 && keycode < 58)   || // numbers
    (keycode > 64 && keycode < 91)); // letters


    //keycode > 95 && keycode < 112 // numpad
    //keycode == 32 || keycode == 13   || space, enter
    //(keycode > 185 && keycode < 193) || // ;=,-./`
    //(keycode > 218 && keycode < 223);   // [\]'

    if(keycode == 27){
      // we cancel edit if the user presses esc
      this.cancelEdit();
    } else if (keycode == 13 && e.ctrlKey && this.state.editing) {
      return;
    } else if(validText) {
      if(!this.state.editing) {
        this.newTask();
      }
    }
  }
  handleExternalSetTasks(e) {    
    var tasks = e.detail.tasks;

    // variable that represents tasks must be an array
    if(!Array.isArray(tasks)) {
      e.detail.callback("Wrong format - cannot load tasks.");
      return;
    }

   for(let task of tasks) {
      // each element in the array (task) must have certain properties, if properties are missing, we report error
      if(typeof task.id == "undefined" || typeof task.title == "undefined" || typeof task.description == "undefined" || typeof task.order == "undefined" || typeof task.state == "undefined") {
        e.detail.callback("Wrong format - cannot load tasks.");
        return;
      }
    }

    this.setState({
      tasks: tasks
    });

    e.detail.callback(false);
  }
  handleExternalGetTasks(e) {
    e.detail.callback(this.state.tasks);
  }
  componentDidMount() {
    keySubscribers["main"] = this.handleKeyShortcuts.bind(this);
    window.addEventListener("newtask", this.newTask.bind(this), false);
    window.addEventListener("set-tasks", this.handleExternalSetTasks.bind(this), false);
    window.addEventListener("get-tasks", this.handleExternalGetTasks.bind(this), false);
  }
  componentWillUnmount() {
    delete keySubscribers["main"];
  }
  render() {
    const backlog = this.getTasks(TaskState.BACKLOG);
    const todo = this.getTasks(TaskState.TODO);
    const wip = this.getTasks(TaskState.WIP);
    const done = this.getTasks(TaskState.DONE);

    return (
      <div>
        <div className="task-table">
          <div className="column column-backlog" onDragOver={(e) => this.handleDragOver(e)} onDrop={() => this.handleDropColumn(TaskState.BACKLOG)}>
            <div className="column-title">Backlog</div>
          {backlog}

          </div>

          <div className="column" onDragOver={(e) => this.handleDragOver(e)} onDrop={() => this.handleDropColumn(TaskState.TODO)}>
            <div className="column-title">TODO</div>
            {todo}
          </div>

          <div className="column" onDragOver={(e) => this.handleDragOver(e)} onDrop={() => this.handleDropColumn(TaskState.WIP)}>
            <div className="column-title">WIP</div>
            {wip}
          </div>

           <div className="column" onDragOver={(e) => this.handleDragOver(e)} onDrop={() => this.handleDropColumn(TaskState.DONE)}>
            <div className="column-title">DONE</div>
            {done}
           </div>

          <div className={this.state.dragged ? 'delete' : 'delete hide'} onDragOver={(e) => this.handleDragOver(e)} onDrop={() => this.deleteDraggedTask()}>
            <span>Drop here to delete.</span>
          </div>
        </div>

        {this.state.editing ? this.createEditor() : null}
      </div>
    );
  }
}

function handleKeyShortcuts(e) {
  for (var key in keySubscribers) {
      keySubscribers[key](e);
  }
}

window.addEventListener("keydown", handleKeyShortcuts, false);

ReactDOM.render(
  <Table />,
  document.getElementById('container')
);
