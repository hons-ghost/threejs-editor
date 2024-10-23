

export class CustomDialog {
    targets = new Map<string, Record<string, unknown>>()
    menu = document.createElement("div")
    
    constructor() {
        this.menu.className = "custom-dig container"

        const body = document.body
        body.appendChild(this.menu)
    }
    clear() {
        while (this.menu.firstChild) this.menu.removeChild(this.menu.firstChild)
        this.menu.style.display = "none"
    }
    display() {
        this.menu.style.display = "block"
    }
    // 객체를 설정하고 속성을 관리하기 위한 메서드
    public add<T extends Record<string, any>>(id: string,
        target: T, property: keyof T, value: T[keyof T]): void {
        // 값의 타입에 따른 처리
        if (typeof value === 'number') {
            this.addNumber(target, property, value)
            console.log(`Setting numeric property: ${String(property)} = ${value}`);
        } else if (typeof value === 'string') {
            console.log(`Setting string property: ${String(property)} = "${value}"`);
        } else if (typeof value === 'boolean') {
            this.addCheckBox(target, property, value)
            console.log(`Setting boolean property: ${String(property)} = ${value}`);
        } else {
            console.log(`Setting property: ${String(property)} = ${value}`);
        }

        // 속성 설정
        target[property] = value;
        this.targets.set(id, target)
    }
    addNumber<T extends Record<string, any>, K extends keyof T>(target: T, property: keyof T, value: T[K]) {
        const id = String(property)
        let html = `
        <div class="row">
            <div class="col">
                <div class="input-group mb-3">
                    <span class="input-group-text" id="basic-addon1">${id}</span>
                    <input type="text" id="${id}-nid" class="form-control" placeholder="${value}
                        aria-label="${value}" aria-describedby="basic-addon1">
                </div>
            </div>
        </div>
        `
        this.menu.insertAdjacentHTML("beforeend", html)
        const dom = document.getElementById(id) as HTMLInputElement
        if (dom) dom.onchange = () => { target[property] = dom.valueAsNumber as T[K]}
    }
    addCheckBox<T extends Record<string, any>, K extends keyof T>(target: T, property: keyof T, value: T[K]) {
        const id = String(property)
        let html = `
        <div class="row">
            <div class="col">
                <div class="form-check">
                    <input type="checkbox" id="${id}-bid" class="form-check-input"
                        ${(value) ? "checked" : ""}">
                    <label class="form-check-label" for="flexcheckchecked">${id}</label>
                </div>
            </div>
        </div>
        `
        this.menu.insertAdjacentHTML("beforeend", html)
        const dom = document.getElementById(id) as HTMLInputElement
        if (dom) dom.onchange = () => { target[property] = dom.value as T[K]}
    }
}
