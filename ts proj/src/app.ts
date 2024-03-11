interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}
interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

function autobind(
  _target: any,
  _method: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    },
  };

  return adjDescriptor;
}

interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

function validate(validatableInput: Validatable) {
  let isValid = true;
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if (
    validatableInput.minLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length > validatableInput.minLength;
  }
  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length < validatableInput.maxLength;
  }
  if (
    validatableInput.max != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value < validatableInput.max;
  }
  if (
    validatableInput.min != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value > validatableInput.min;
  }
  return isValid;
}

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateElId: string,
    hostElId: string,
    insertAtStart: boolean,
    newElId?: string
  ) {
    this.templateElement = document.getElementById(
      templateElId
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElId)! as T;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as U;
    if (newElId) this.element.id = newElId;

    this.attach(insertAtStart);
  }
  private attach(insertAtBegin: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtBegin ? "afterbegin" : "beforeend",
      this.element
    );
  }

  abstract configure(): void;
  abstract renderContent(): void;
}

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleEl: HTMLInputElement;
  descEl: HTMLInputElement;
  peopleEl: HTMLInputElement;

  constructor() {
    super("project-input", "app", true, "user-input");

    this.titleEl = this.element.querySelector("#title") as HTMLInputElement;
    this.descEl = this.element.querySelector(
      "#description"
    )! as HTMLInputElement;
    this.peopleEl = this.element.querySelector("#people")! as HTMLInputElement;
    this.configure();
  }

  private collectInput(): [string, string, string] | void {
    const title = this.titleEl.value;
    const people = this.peopleEl.value;
    const desc = this.descEl.value;

    const titleValidatable: Validatable = {
      value: title,
      required: true,
    };
    const descriptionValidatable: Validatable = {
      value: desc,
      required: true,
      minLength: 5,
    };
    const peopleValidatable: Validatable = {
      value: +people,
      required: true,
      min: 1,
    };
    if (
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(peopleValidatable)
    ) {
      alert("invalid input");
      return;
    } else {
      return [title, people, desc];
    }
  }

  private clearInput() {
    this.titleEl.value = "";
    this.peopleEl.value = "";
    this.descEl.value = "";
  }

  @autobind
  private handleSubmit(e: Event) {
    e.preventDefault();
    const userInput = this.collectInput();
    if (Array.isArray(userInput)) {
      const [title, people, desc] = userInput;
      projectState.addProject(title, +people, desc);
      this.clearInput();
    }
  }

  configure() {
    this.element.addEventListener("submit", this.handleSubmit);
  }
  renderContent(): void {}
}

class ProjectItem
  extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggable
{
  private project: Project;
  constructor(hostId: string, project: Project) {
    console.log("first");
    super("single-project", hostId, false, project.id);
    this.project = project;

    this.configure();
    this.renderContent();
  }
  @autobind
  dragStartHandler(event: DragEvent): void {
    console.log("event", event);
    event.dataTransfer!.setData("text/plain", this.project.id);
    event.dataTransfer!.effectAllowed = "move";
  }
  dragEndHandler(_event: DragEvent): void {
    console.log("dragend");
  }
  configure(): void {
    this.element.addEventListener("dragstart", this.dragStartHandler);
    this.element.addEventListener("dragend", this.dragEndHandler);
  }
  renderContent(): void {
    const a = (this.element.querySelector("h2")!.textContent =
      this.project.title);
    console.log("a", a);
    this.element.querySelector("h3")!.textContent =
      this.project.people.toString();
    this.element.querySelector("p")!.textContent = this.project.description;
  }
}
class ProjectList
  extends Component<HTMLDivElement, HTMLElement>
  implements DragTarget
{
  assignedProjs: Project[];

  constructor(private type: "active" | "finished") {
    super("project-list", "app", false, `${type}-projects`);
    this.assignedProjs = [];

    this.configure();
    this.renderContent();
  }
  @autobind
  dragLeaveHandler(_event: DragEvent): void {
    const listEl = this.element.querySelector("ul")!;
    listEl.classList.remove("droppable");
  }

  @autobind
  dragOverHandler(event: DragEvent): void {
    if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
      event.preventDefault();
      const listEl = this.element.querySelector("ul")!;
      listEl.classList.add("droppable");
    }
  }

  @autobind
  dropHandler(event: DragEvent): void {
    const pid = event.dataTransfer!.getData("text/plain");
    projectState.moveProject(pid,this.type==='active'?ProjectStatus.Active:ProjectStatus.Finished)
  }

  configure() {
    this.element.addEventListener("dragover", this.dragOverHandler);
    this.element.addEventListener("dragleave", this.dragLeaveHandler);
    this.element.addEventListener("drop", this.dropHandler);
    projectState.addListener((projects: Project[]) => {
      console.log("projects", projects);
      const relevantProjs = projects.filter((p) => {
        if (this.type === "active") return p.status === ProjectStatus.Active;
        return p.status === ProjectStatus.Finished;
      });
      // console.log("relevantProjs", relevantProjs);
      this.assignedProjs = relevantProjs;
      this.renderProjects();
    });
  }
  renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " PROJECTS";
  }
  renderProjects() {
    console.log("this.assignedProjsss", this.assignedProjs);
    console.log("x");
    const listEL = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement;
    listEL.innerHTML = "";
    this.assignedProjs.map((project) => {
      new ProjectItem(this.element.querySelector("ul")!.id, project);
    });
  }
}

enum ProjectStatus {
  Active,
  Finished,
}
class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

type Listener<T> = (items: T[]) => void;

class State<T> {
  listeners: Listener<T>[] = [];
  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
    // console.log("this.listeners", this.listeners);
  }
}
class ProjectState extends State<Project> {
  projects: Project[] = [];

  constructor() {
    super();
  }

  addProject(t: string, p: number, d: string) {
    const newProj = new Project(
      new Date().toLocaleString(),
      t,
      d,
      p,
      ProjectStatus.Active
    );
    this.projects.push(newProj);
    this.updateListeners()

   
  }

  moveProject(projectId: string, newStatus: ProjectStatus) {
    const project = this.projects.find((prj) => prj.id === projectId);
    if (project) {
      project.status = newStatus;
      this.updateListeners()
    }
  }
  private updateListeners() {
     for (const listnerFn of this.listeners) {
      // console.log("listnerFn", listnerFn);
      listnerFn(this.projects.slice());
    }
  }
}
const projectState = new ProjectState();

const prjInput = new ProjectInput();
const finishedPrjList = new ProjectList("finished");
const activePrjList = new ProjectList("active");
