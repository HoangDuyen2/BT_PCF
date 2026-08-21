import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AdvancedOptionsControl, IConfig, ISetupSchema } from "./AdvancedOptionsControl";
import { initializeIcons } from '@fluentui/react/lib/Icons';

const initializeIconsForEnvironment = () => {
	try {
		// Initialize standard icons multiple times to ensure they load in Power Platform
		initializeIcons();

		// Force icon initialization again after a short delay for Power Platform compatibility
		if (typeof window !== 'undefined') {
			setTimeout(() => {
				try {
					initializeIcons();
				} catch (e) {
					console.warn("Secondary icon initialization failed:", e);
				}
			}, 100);
		}

		return true;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (err: any) {
		console.error("❌ CRITICAL error during metadata fetch setup:", err);
		return false;
	}
};

// Initialize icons immediately
initializeIconsForEnvironment();



const DEFAULT_OPTIONS: ComponentFramework.PropertyHelper.OptionMetadata[] = [{
	Value: 768210001,
	Label: "Female",
	Color: "#ff0000"
},
{
	Value: 768210000,
	Label: "Male",
	Color: "#00ff00"
}
];

export class NewModal implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _notifyOutputChanged: () => void;
	private _value: string ;
    private _style : string | null;
    private _class : string | null;
	private _input: HTMLInputElement;
    private _context: ComponentFramework.Context<IInputs>;
    private _container: HTMLDivElement;
    private _dropdownElement: HTMLDivElement;
    private labelElement: HTMLLabelElement;

    private allOptions: ComponentFramework.PropertyHelper.OptionMetadata[];
	private dropdownOptions: IDropdownOption[];
	private defaultValue: number | undefined;
	private isDisabled: boolean;
    private currentValue: number | null;
	private config: IConfig | undefined;


    /**
     * Empty constructor.
     */
    constructor() {
        // Empty
    }

    private parseIconConfig(defaultIcon: string, iconConfig?: string, sortBy?: "Text" | "Value", hideHiddenOptions?: boolean, showColorIcon?: boolean, showColorBorder?: boolean, showColorBackground?: "No" | "Lighter" | "Full", makeFontBold?: boolean, componentHeight?: "Tall" | "Short", iconColorOverride?: string, useExternalValueForIcon?: boolean): IConfig {
		const isJSON = iconConfig && iconConfig.includes("{");

		// Normalize hex color (ensure it starts with #)
		let normalizedIconColor: string | undefined;
		if (iconColorOverride) {
			normalizedIconColor = iconColorOverride.startsWith('#') ? iconColorOverride : `#${iconColorOverride}`;
		}

		this.config = {
			jsonConfig: isJSON === true ? JSON.parse(iconConfig as string) as ISetupSchema : undefined,
			defaultIconName: (!isJSON ? iconConfig : defaultIcon) ?? defaultIcon,
			sortBy: sortBy ?? "Value",
			hideHiddenOptions: hideHiddenOptions ?? true,
			showColorIcon: showColorIcon ?? false,
			showColorBorder: showColorBorder ?? false,
			showColorBackground: showColorBackground ?? "No",
			makeFontBold: makeFontBold ?? false,
			componentHeight: componentHeight ?? "Tall",
			iconColorOverride: normalizedIconColor,
			useExternalValueForIcon: useExternalValueForIcon ?? false
		}
		return this.config;
	}

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        // Add control initialization code
        this._notifyOutputChanged = notifyOutputChanged;
		this._context = context;
		this._container = document.createElement("div");
        // this._container.setAttribute("style", "display: flex; gap: 8px; align-items: center;");
		this._style = context.parameters.style.raw ? context.parameters.style.raw : "background-color: white;";
        this._class = context.parameters.class.raw ? this._class = context.parameters.class.raw : "pcfDefault";
        this._dropdownElement = document.createElement("div");

        this.labelElement = document.createElement("label");
        this.labelElement.setAttribute("class", this._class);
        this.labelElement.setAttribute("style", "text-align: left; padding-left: 30px; margin-bottom: 5px; font-weight: bold; display: block; color: #333;");
        this.labelElement.setAttribute("id", "NewModalLabel");
        this.labelElement.textContent = "Full name";

        this._input = document.createElement("input");
        // this._input.setAttribute("class", this._class);
        this._input.setAttribute("style", this._style);
        this._input.setAttribute("id", "NewModalInput");
        this._input.value = this._value;
        this._input.addEventListener("change", (e: Event): void => {
            this._value = this._input.value;
            this._notifyOutputChanged();
        });

        this._dropdownElement.setAttribute("id", "NewModalDropdown");
        this._dropdownElement.setAttribute("class", this._class);
        this._dropdownElement.setAttribute("style", this._style);
        this._dropdownElement = this.renderControl(context) as unknown as HTMLDivElement;

        this._value = context.parameters.NewModal.raw || "";
        this._container.appendChild(this.labelElement);
		this._container.appendChild(this._input);
        this._container.appendChild(this._dropdownElement);
        container.appendChild(this._container);
    }

    public onChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string): void => {
        this._value = newValue || "";
        this._notifyOutputChanged();
    }

    private renderControl(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        this.isDisabled = context.mode.isControlDisabled;
		this.currentValue = context.parameters.optionsInput.raw;

        const hideHiddenOptions = context.parameters.hideHiddenOptions?.raw ?? true;
		const showColorIcon = context.parameters.showColorIcon?.raw ?? false;
		const componentHeight = context.parameters.componentHeight?.raw ?? "Tall";
		const iconColorOverride = context.parameters.iconColorOverride?.raw || undefined;
		const showColorBorder = context.parameters.showColorBorder?.raw ?? false;
		const showColorBackground = context.parameters.showColorBackground?.raw ?? "No";
		const makeFontBold = context.parameters.makeFontBold?.raw ?? false;
		const useExternalValueForIcon = context.parameters.useExternalValueForIcon?.raw ?? false;

        let sourceOptions: ComponentFramework.PropertyHelper.OptionMetadata[];
        sourceOptions = DEFAULT_OPTIONS as ComponentFramework.PropertyHelper.OptionMetadata[];


		// Filter options based on hideHiddenOptions setting
		let filteredOptions = sourceOptions;
		if (hideHiddenOptions) {
			filteredOptions = filteredOptions.filter(opt => {
				const optAny = opt as unknown as Record<string, unknown>;
				return optAny.IsHidden !== true;
			});
		}

		// Get the color of the currently selected option for border styling
		const selectedOption = filteredOptions.find(opt => opt.Value === this.currentValue);
		const selectedColor = selectedOption?.Color;

		const params = {
			rawOptions: filteredOptions,
			selectedKey: this.currentValue,
			onChange: this.onChange,
			isDisabled: this.isDisabled,
			defaultValue: this.defaultValue,
			config: this.parseIconConfig( // Always regenerate config for real-time updates
				"FullCircleMask",
				context.parameters.icon?.raw ?? undefined,
				context.parameters.sortBy.raw,
				hideHiddenOptions,
				showColorIcon,
				showColorBorder,
				showColorBackground,
				makeFontBold,
				componentHeight,
				iconColorOverride,
				useExternalValueForIcon
			),
			selectedColor: selectedColor,
			contextUtils: context.utils,
			contextParameters: context.parameters,
			contextMode: context.mode
		};
		return React.createElement(AdvancedOptionsControl);
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        // Add code to update control view
        this._value = context.parameters.NewModal.raw || "" ;
		this._input.value = this._value;
        this._context = context;
        //this._notifyOutputChanged();
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return {
            NewModal: this._value
          };
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }
}
