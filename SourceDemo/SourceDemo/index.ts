import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class SourceDemo implements ComponentFramework.StandardControl<
  IInputs,
  IOutputs
> {
  private _value: number;
  private _notifyOutputChanged: () => void;
  private labelElement: HTMLLabelElement;
  private inputElement: HTMLInputElement;
  private _container: HTMLDivElement;
  private _context: ComponentFramework.Context<IInputs>;
  private _refreshData: EventListenerOrEventListenerObject;

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement,
  ): void {
    this._context = context;
    this._notifyOutputChanged = notifyOutputChanged;
    this._refreshData = this.refreshData.bind(this);

    // Khởi tạo Wrapper Container
    this._container = document.createElement("div");
    this._container.className = "custom-slider-container";

    // Khởi tạo Input Slider
    this.inputElement = document.createElement("input");
    this.inputElement.setAttribute("type", "range");
    this.inputElement.setAttribute("min", "1");
    this.inputElement.setAttribute("max", "250");
    this.inputElement.className = "custom-slider";
    this.inputElement.addEventListener("input", this._refreshData);

    // Khởi tạo Label/Badge hiển thị giá trị
    this.labelElement = document.createElement("label");
    this.labelElement.className = "custom-slider-badge";

    // Gán giá trị ban đầu
    const initialRaw = context.parameters.controlValue.raw;
    this._value =
      initialRaw !== null && initialRaw !== undefined ? initialRaw : 1;

    this.inputElement.value = this._value.toString();
    this.labelElement.innerText = this._value.toString();

    // Ráp vào DOM
    this._container.appendChild(this.inputElement);
    this._container.appendChild(this.labelElement);
    container.appendChild(this._container);
  }

  public refreshData(evt: Event): void {
    this._value = Number(this.inputElement.value);
    this.labelElement.innerText = this.inputElement.value;
    this._notifyOutputChanged();
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    this._context = context;
    const currentRaw = context.parameters.controlValue.raw;
    this._value =
      currentRaw !== null && currentRaw !== undefined ? currentRaw : 1;

    this.inputElement.value = this._value.toString();
    this.labelElement.innerText = this._value.toString();
  }

  public getOutputs(): IOutputs {
    return {
      controlValue: this._value,
    };
  }

  public destroy(): void {
    this.inputElement.removeEventListener("input", this._refreshData);
  }
}
