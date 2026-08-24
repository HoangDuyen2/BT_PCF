import { initializeIcons } from "@fluentui/react/lib/Icons";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { Grid } from "./Grid";
import { StudentFormData } from "./StudentModal";

initializeIcons(undefined, { disableWarnings: true });

const ENTITY_NAME = "ksvc_tra_student";
const CLASS_ENTITY_NAME = "ksvc_mst_class";
const CLASS_ENTITY_SET_NAME = "ksvc_mst_classes";

interface DataverseOptionItem {
	Value: number;
	Label?: {
		UserLocalizedLabel?: {
			Label: string;
		};
	};
}

interface DataverseOptionSetResponse {
	OptionSet?: {
		Options?: DataverseOptionItem[];
	};
}

export class DemoDataset implements ComponentFramework.StandardControl<IInputs, IOutputs> {
	private notifyOutputChanged: () => void;
	private container: HTMLDivElement;
	private context: ComponentFramework.Context<IInputs>;
	private sortedRecordsIds: string[] = [];
	private resources: ComponentFramework.Resources;
	private isTestHarness: boolean;
	private records: Record<string, ComponentFramework.PropertyHelper.DataSetApi.EntityRecord> = {};
	private currentPage = 1;
	private isFullScreen = false;
	private root: ReactDOM.Root;

	private classOptions: IDropdownOption[] = [];
	private genderOptions: IDropdownOption[] = [];
	private statusOptions: IDropdownOption[] = [];

	private async loadOptionSetMetadata(attributeName: string): Promise<IDropdownOption[]> {
		const query = `EntityDefinitions(LogicalName='${ENTITY_NAME}')/Attributes(LogicalName='${attributeName}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)`;

		try {
			const response = await fetch(`/api/data/v9.2/${query}`, {
				method: "GET",
				headers: {
					"OData-MaxVersion": "4.0",
					"OData-Version": "4.0",
					"Content-Type": "application/json; charset=utf-8",
					Accept: "application/json",
				},
			});

			if (response.ok) {
				const data = (await response.json()) as DataverseOptionSetResponse;
				const options = data.OptionSet?.Options || [];

				return options.map((opt) => ({
					key: opt.Value,
					text: opt.Label?.UserLocalizedLabel?.Label || String(opt.Value),
				}));
			}
		} catch (error) {
			console.warn(`Không lấy được options của ${attributeName}:`, error);
		}
		return [];
	}

	// Tải danh sách Class từ bảng ksvc_mst_class
	private async loadClassOptions(): Promise<IDropdownOption[]> {
		try {
			const response = await this.context.webAPI.retrieveMultipleRecords(
				CLASS_ENTITY_NAME,
				"?$select=ksvc_mst_classid,ksvc_slt_classcode&$top=50"
			);
			return response.entities.map((c) => ({
				key: c.ksvc_mst_classid as string,
				text: (c.ksvc_slt_classcode as string),
			}));
		} catch (e) {
			console.warn("Không tải được danh sách Class:", e);
			return [];
		}
	}

	private setSelectedRecords = (ids: string[]): void => {
		this.context.parameters.records.setSelectedRecordIds(ids);
	};

	private onNavigate = (item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord): void => {
		if (item) {
			this.context.parameters.records.openDatasetItem(item.getNamedReference());
		}
	};

	private onSort = (name: string, desc: boolean): void => {
		const sorting = this.context.parameters.records.sorting;
		while (sorting.length > 0) {
			sorting.pop();
		}
		this.context.parameters.records.sorting.push({
			name: name,
			sortDirection: desc ? 1 : 0,
		});
		this.context.parameters.records.refresh();
	};

	private onFilter = (name: string, filter: boolean): void => {
		const filtering = this.context.parameters.records.filtering;
		if (filter) {
			filtering.setFilter({
				conditions: [
					{
						attributeName: name,
						conditionOperator: 12,
					},
				],
			} as ComponentFramework.PropertyHelper.DataSetApi.FilterExpression);
		} else {
			filtering.clearFilter();
		}
		this.context.parameters.records.refresh();
	};

	private loadFirstPage = (): void => {
		this.currentPage = 1;
		this.context.parameters.records.paging.loadExactPage(1);
	};

	private loadNextPage = (): void => {
		this.currentPage++;
		this.context.parameters.records.paging.loadExactPage(this.currentPage);
	};

	private loadPreviousPage = (): void => {
		this.currentPage--;
		this.context.parameters.records.paging.loadExactPage(this.currentPage);
	};

	private onFullScreen = (): void => {
		this.context.mode.setFullScreen(true);
	};

	private buildPayload = (data: StudentFormData): ComponentFramework.WebApi.Entity => {
		const payload: ComponentFramework.WebApi.Entity = {
			ksvc_slt_studentname: data.fullName,
			ksvc_slt_studentcode: data.studentCode,
			ksvc_opt_gender: data.gender,
			ksvc_dat_birthday: data.birthday ? data.birthday.toISOString().split("T")[0] : null,
			ksvc_opt_learningstatus: data.learningStatus,
			ksvc_dcn_gpascore: data.gpaScore,
			ksvc_int_toltalcredit: data.totalCredit,
		};

		if (data.classId) {
			payload["ksvc_lup_class@odata.bind"] = `/${CLASS_ENTITY_SET_NAME}(${data.classId.replace(/[{}]/g, "")})`;
		}

		return payload;
	};

	private handleCreateRecord = async (data: StudentFormData): Promise<void> => {
		try {
			const payload = this.buildPayload(data);
			await this.context.webAPI.createRecord(ENTITY_NAME, payload);
			this.context.parameters.records.refresh();
		} catch (error) {
			console.error("Lỗi khi tạo mới record:", error);
		}
	};

	private handleUpdateRecord = async (id: string, data: StudentFormData): Promise<void> => {
		try {
			const payload = this.buildPayload(data);
			await this.context.webAPI.updateRecord(ENTITY_NAME, id, payload);
			this.context.parameters.records.refresh();
		} catch (error) {
			console.error("Lỗi khi cập nhật record:", error);
		}
	};

	private handleDeleteRecord = async (id: string): Promise<void> => {
		try {
			await this.context.webAPI.deleteRecord(ENTITY_NAME, id);
			this.context.parameters.records.refresh();
		} catch (error) {
			console.error("Lỗi khi xoá record:", error);
		}
	};

	public async init(
		context: ComponentFramework.Context<IInputs>,
		notifyOutputChanged: () => void,
		state: ComponentFramework.Dictionary,
		container: HTMLDivElement
	): Promise<void> {
		this.notifyOutputChanged = notifyOutputChanged;
		this.container = container;
		this.root = ReactDOM.createRoot(container);
		this.context = context;
		this.context.mode.trackContainerResize(true);
		this.resources = this.context.resources;
		this.isTestHarness = document.getElementById("control-dimensions") !== null;

		this.classOptions = await this.loadClassOptions();
		this.genderOptions = await this.loadOptionSetMetadata("ksvc_opt_gender");
		this.statusOptions = await this.loadOptionSetMetadata("ksvc_opt_learningstatus");

		// if (this.genderOptions.length === 0) {
		// 	console.warn("Không tải được metadata cho trường ksvc_opt_gender.");
		// }
		// if (this.statusOptions.length === 0) {
		// 	console.warn("Không tải được metadata cho trường ksvc_opt_learningstatus.");
		// }
		console.log("Gender options: ", this.genderOptions);
		console.log("Learning status options: ", this.statusOptions);
	}

	public updateView(context: ComponentFramework.Context<IInputs>): void {
		this.context = context;
		const dataset = context.parameters.records;
		const paging = dataset.paging;

		if (context.updatedProperties.includes("fullscreen_close")) {
			this.isFullScreen = false;
		}
		if (context.updatedProperties.includes("fullscreen_open")) {
			this.isFullScreen = true;
		}

		this.records = dataset.records;
		this.sortedRecordsIds = dataset.sortedRecordIds || [];

		const allocatedWidth = parseInt(context.mode.allocatedWidth as unknown as string);
		let allocatedHeight = parseInt(context.mode.allocatedHeight as unknown as string);

		if (!this.isFullScreen && context.parameters.SubGridHeight?.raw) {
			allocatedHeight = context.parameters.SubGridHeight.raw;
		}

		this.root.render(
			React.createElement(Grid, {
				width: allocatedWidth,
				height: allocatedHeight,
				columns: dataset.columns,
				records: this.records,
				sortedRecordIds: this.sortedRecordsIds,
				hasNextPage: paging.hasNextPage,
				hasPreviousPage: paging.hasPreviousPage,
				currentPage: this.currentPage,
				totalResultCount: paging.totalResultCount,
				sorting: dataset.sorting,
				filtering: dataset.filtering?.getFilter(),
				resources: this.resources,
				itemsLoading: dataset.loading,
				highlightValue: context.parameters.HighlightValue?.raw ?? null,
				highlightColor: context.parameters.HighlightColor?.raw ?? null,
				classOptions: this.classOptions,
				genderOptions: this.genderOptions,
				learningStatusOptions: this.statusOptions,
				setSelectedRecords: this.setSelectedRecords,
				onNavigate: this.onNavigate,
				onSort: this.onSort,
				onFilter: this.onFilter,
				loadFirstPage: this.loadFirstPage,
				loadNextPage: this.loadNextPage,
				loadPreviousPage: this.loadPreviousPage,
				isFullScreen: this.isFullScreen,
				onFullScreen: this.onFullScreen,
				onCreateRecord: this.handleCreateRecord,
				onUpdateRecord: this.handleUpdateRecord,
				onDeleteRecord: this.handleDeleteRecord,
			})
		);
	}

	public getOutputs(): IOutputs {
		return {} as IOutputs;
	}

	public destroy(): void {
		this.root.unmount();
	}
}
