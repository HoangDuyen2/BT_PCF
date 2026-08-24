import * as React from "react";
import { useConst, useForceUpdate } from "@fluentui/react-hooks";
import { IObjectWithKey, IRenderFunction, SelectionMode } from "@fluentui/react/lib/Utilities";
import {
	ConstrainMode,
	DetailsList,
	DetailsListLayoutMode,
	DetailsRow,
	IColumn,
	IDetailsHeaderProps,
	IDetailsListProps,
	IDetailsRowStyles,
} from "@fluentui/react/lib/DetailsList";
import { Sticky, StickyPositionType } from "@fluentui/react/lib/Sticky";
import { ContextualMenu, DirectionalHint, IContextualMenuProps } from "@fluentui/react/lib/ContextualMenu";
import { ScrollablePane, ScrollbarVisibility } from "@fluentui/react/lib/ScrollablePane";
import { Stack } from "@fluentui/react/lib/Stack";
import { Overlay } from "@fluentui/react/lib/Overlay";
import { IconButton, PrimaryButton, DefaultButton } from "@fluentui/react/lib/Button";
import { Selection } from "@fluentui/react/lib/Selection";
import { Link } from "@fluentui/react/lib/Link";
import { Icon } from "@fluentui/react/lib/Icon";
import { Text } from "@fluentui/react/lib/Text";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { StudentModal, StudentFormData } from "./StudentModal";

type DataSet = ComponentFramework.PropertyHelper.DataSetApi.EntityRecord & IObjectWithKey;

function stringFormat(template: string, ...args: string[]): string {
	args?.forEach((arg, index) => {
		template = template.replace(`{${index}}`, arg);
	});
	return template;
}

export interface GridProps {
	width?: number;
	height?: number;
	columns: ComponentFramework.PropertyHelper.DataSetApi.Column[];
	records: Record<string, ComponentFramework.PropertyHelper.DataSetApi.EntityRecord>;
	sortedRecordIds: string[];
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	totalResultCount: number;
	currentPage: number;
	sorting: ComponentFramework.PropertyHelper.DataSetApi.SortStatus[];
	filtering: ComponentFramework.PropertyHelper.DataSetApi.FilterExpression;
	resources: ComponentFramework.Resources;
	itemsLoading: boolean;
	highlightValue: string | null;
	highlightColor: string | null;
	classOptions: IDropdownOption[];
	genderOptions: IDropdownOption[];
	learningStatusOptions: IDropdownOption[];
	setSelectedRecords: (ids: string[]) => void;
	onNavigate: (item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord) => void;
	onSort: (name: string, desc: boolean) => void;
	onFilter: (name: string, filtered: boolean) => void;
	loadFirstPage: () => void;
	loadNextPage: () => void;
	loadPreviousPage: () => void;
	onFullScreen: () => void;
	isFullScreen: boolean;
	onCreateRecord: (data: StudentFormData) => Promise<void>;
	onUpdateRecord: (id: string, data: StudentFormData) => Promise<void>;
	onDeleteRecord: (id: string) => Promise<void>;
}

const onRenderDetailsHeader: IRenderFunction<IDetailsHeaderProps> = (props, defaultRender) => {
	if (props && defaultRender) {
		return (
			<Sticky stickyPosition={StickyPositionType.Header} isScrollSynced>
				{defaultRender({ ...props })}
			</Sticky>
		);
	}
	return null;
};

const onRenderItemColumn = (
	item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
	index?: number,
	column?: IColumn
) => {
	if (column?.fieldName && item) {
		return <>{item.getFormattedValue(column.fieldName)}</>;
	}
	return <></>;
};

export const Grid = React.memo((props: GridProps) => {
	const {
		records,
		sortedRecordIds,
		columns,
		width,
		height,
		hasNextPage,
		hasPreviousPage,
		sorting,
		filtering,
		currentPage,
		itemsLoading,
		classOptions,
		genderOptions,
		learningStatusOptions,
		setSelectedRecords,
		onNavigate,
		onSort,
		onFilter,
		resources,
		loadFirstPage,
		loadNextPage,
		loadPreviousPage,
		onFullScreen,
		isFullScreen,
		highlightValue,
		highlightColor,
		totalResultCount,
		onCreateRecord,
		onUpdateRecord,
		onDeleteRecord,
	} = props;

	const forceUpdate = useForceUpdate();
	const [isComponentLoading, setIsLoading] = React.useState<boolean>(false);
	const [contextualMenuProps, setContextualMenuProps] = React.useState<IContextualMenuProps>();

	const [selectedId, setSelectedId] = React.useState<string | null>(null);
	const [modalOpen, setModalOpen] = React.useState<boolean>(false);
	const [modalMode, setModalMode] = React.useState<"new" | "edit">("new");
	const [editingData, setEditingData] = React.useState<StudentFormData | null>(null);

	const onSelectionChanged = React.useCallback(() => {
		const selectedIndices = selection.getSelectedIndices();
		if (selectedIndices.length > 0) {
			const currentId = sortedRecordIds[selectedIndices[0]];
			setSelectedId(currentId);
			setSelectedRecords([currentId]);
		} else {
			setSelectedId(null);
			setSelectedRecords([]);
		}
		forceUpdate();
	}, [sortedRecordIds, forceUpdate, setSelectedRecords]);

	const selection: Selection = useConst(() => {
		return new Selection({
			selectionMode: SelectionMode.single,
			onSelectionChanged: onSelectionChanged,
		});
	});

	const onContextualMenuDismissed = React.useCallback(() => {
		setContextualMenuProps(undefined);
	}, []);

	const items: (DataSet | undefined)[] = React.useMemo(() => {
		setIsLoading(false);
		return sortedRecordIds.map((id) => records[id]);
	}, [records, sortedRecordIds]);

	const getContextualMenuProps = React.useCallback(
		(column: IColumn, ev: React.MouseEvent<HTMLElement>): IContextualMenuProps => {
			const menuItems = [
				{
					key: "aToZ",
					name: resources.getString("Label_SortAZ"),
					iconProps: { iconName: "SortUp" },
					canCheck: true,
					checked: column.isSorted && !column.isSortedDescending,
					disable: (column.data as ComponentFramework.PropertyHelper.DataSetApi.Column).disableSorting,
					onClick: () => {
						onSort(column.key, false);
						setContextualMenuProps(undefined);
						if (items && items.length > 0) setIsLoading(true);
					},
				},
				{
					key: "zToA",
					name: resources.getString("Label_SortZA"),
					iconProps: { iconName: "SortDown" },
					canCheck: true,
					checked: column.isSorted && column.isSortedDescending,
					disable: (column.data as ComponentFramework.PropertyHelper.DataSetApi.Column).disableSorting,
					onClick: () => {
						onSort(column.key, true);
						setContextualMenuProps(undefined);
						if (items && items.length > 0) setIsLoading(true);
					},
				},
				{
					key: "filter",
					name: resources.getString("Label_DoesNotContainData"),
					iconProps: { iconName: "Filter" },
					canCheck: true,
					checked: column.isFiltered,
					onClick: () => {
						onFilter(column.key, column.isFiltered !== true);
						setContextualMenuProps(undefined);
						setIsLoading(true);
					},
				},
			];
			return {
				items: menuItems,
				target: ev.currentTarget as HTMLElement,
				directionalHint: DirectionalHint.bottomLeftEdge,
				gapSpace: 10,
				isBeakVisible: true,
				onDismiss: onContextualMenuDismissed,
			};
		},
		[resources, onSort, onFilter, onContextualMenuDismissed, items]
	);

	const onColumnContextMenu = React.useCallback(
		(column?: IColumn, ev?: React.MouseEvent<HTMLElement>) => {
			if (column && ev) {
				setContextualMenuProps(getContextualMenuProps(column, ev));
			}
		},
		[getContextualMenuProps]
	);

	const onColumnClick = React.useCallback(
		(ev: React.MouseEvent<HTMLElement>, column: IColumn) => {
			if (column && ev) {
				setContextualMenuProps(getContextualMenuProps(column, ev));
			}
		},
		[getContextualMenuProps]
	);

	const onNextPage = React.useCallback(() => {
		setIsLoading(true);
		loadNextPage();
	}, [loadNextPage]);

	const onPreviousPage = React.useCallback(() => {
		setIsLoading(true);
		loadPreviousPage();
	}, [loadPreviousPage]);

	const onFirstPage = React.useCallback(() => {
		setIsLoading(true);
		loadFirstPage();
	}, [loadFirstPage]);

	const gridColumns = React.useMemo(() => {
		return columns
			.filter((col) => !col.isHidden && col.order >= 0)
			.sort((a, b) => a.order - b.order)
			.map((col) => {
				const sortOn = sorting?.find((s) => s.name === col.name);
				const filtered = filtering?.conditions?.find((f) => f.attributeName === col.name);
				return {
					key: col.name,
					name: col.displayName,
					fieldName: col.name,
					isSorted: sortOn != null,
					isSortedDescending: sortOn?.sortDirection === 1,
					isResizable: true,
					isFiltered: filtered != null,
					data: col,
					minWidth: col.visualSizeFactor > 100 ? col.visualSizeFactor : 100,
					onColumnContextMenu: onColumnContextMenu,
					onColumnClick: onColumnClick,
				} as IColumn;
			});
	}, [columns, sorting, filtering, onColumnContextMenu, onColumnClick]);

	const rootContainerStyle: React.CSSProperties = React.useMemo(() => {
		return {
			height: height === -1 ? "100%" : height,
			width: width,
		};
	}, [width, height]);

	const onRenderRow: IDetailsListProps["onRenderRow"] = (props) => {
		const customStyles: Partial<IDetailsRowStyles> = {};

		if (props?.item) {
			if (highlightColor && highlightValue && props.item.getValue("HighlightIndicator") === highlightValue) {
				customStyles.root = { backgroundColor: highlightColor };
			}
			return <DetailsRow {...props} styles={customStyles} />;
		}

		return null;
	};

	const handleOpenNew = React.useCallback(() => {
		setModalMode("new");
		setEditingData(null);
		setModalOpen(true);
	}, []);

	const handleOpenEdit = React.useCallback(() => {
		if (!selectedId) return;
		const record = records[selectedId];
		setModalMode("edit");

		const rawBirthday = (record.getValue("ksvc_dat_birthday") as string) || null;

		// Lấy EntityReference của Lookup Class nếu có
		const rawClass = record.getValue("ksvc_lup_class") as ComponentFramework.EntityReference | undefined;

		setEditingData({
			id: selectedId,
			studentCode: (record.getValue("ksvc_slt_studentcode") as string) || "",
			fullName: (record.getValue("ksvc_slt_studentname") as string) || "",
			classId: rawClass?.id?.guid || (rawClass?.id as unknown as string) || undefined,
			gender: (record.getValue("ksvc_opt_gender") as number) || undefined,
			birthday: rawBirthday ? new Date(rawBirthday) : null,
			learningStatus: (record.getValue("ksvc_opt_learningstatus") as number) || undefined,
			gpaScore: (record.getValue("ksvc_dcn_gpascore") as number) ?? 0,
			totalCredit: (record.getValue("ksvc_int_toltalcredit") as number) ?? 0,
		});
		setModalOpen(true);
	}, [selectedId, records]);

	const handleDelete = React.useCallback(async () => {
		if (selectedId && confirm("Bạn có chắc chắn muốn xoá bản ghi sinh viên này?")) {
			setIsLoading(true);
			await onDeleteRecord(selectedId);
			setSelectedId(null);
			selection.setAllSelected(false);
			setIsLoading(false);
		}
	}, [selectedId, onDeleteRecord, selection]);

	const handleSave = React.useCallback(
		async (data: StudentFormData) => {
			setIsLoading(true);
			if (modalMode === "new") {
				await onCreateRecord(data);
			} else if (modalMode === "edit" && selectedId) {
				await onUpdateRecord(selectedId, data);
			}
			setModalOpen(false);
			setIsLoading(false);
		},
		[modalMode, selectedId, onCreateRecord, onUpdateRecord]
	);

	return (
		<Stack verticalFill grow style={rootContainerStyle}>
			<Stack horizontal tokens={{ childrenGap: 8 }} style={{ padding: "6px 8px", background: "#f3f2f1", borderBottom: "1px solid #e1dfdd" }}>
				<PrimaryButton iconProps={{ iconName: "Add" }} text="New" onClick={handleOpenNew} />
				<DefaultButton iconProps={{ iconName: "Edit" }} text="Edit" disabled={!selectedId} onClick={handleOpenEdit} />
				<DefaultButton iconProps={{ iconName: "Delete" }} text="Delete" disabled={!selectedId} onClick={handleDelete} />
			</Stack>

			<Stack.Item grow style={{ position: "relative", backgroundColor: "white", zIndex: 0 }}>
				{!itemsLoading && !isComponentLoading && items && items.length === 0 && (
					<Stack grow horizontalAlign="center" className="noRecords">
						<Icon iconName="PageList" />
						<Text variant="large">{resources.getString("Label_NoRecords")}</Text>
					</Stack>
				)}
				<ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
					<DetailsList
						columns={gridColumns}
						onRenderItemColumn={onRenderItemColumn}
						onRenderDetailsHeader={onRenderDetailsHeader}
						items={items}
						setKey={`set${currentPage}`}
						initialFocusedIndex={0}
						checkButtonAriaLabel="select row"
						layoutMode={DetailsListLayoutMode.fixedColumns}
						constrainMode={ConstrainMode.unconstrained}
						selectionMode={SelectionMode.single}
						selection={selection}
						onItemInvoked={onNavigate}
						onRenderRow={onRenderRow}
					/>
					{contextualMenuProps && <ContextualMenu {...contextualMenuProps} />}
				</ScrollablePane>
				{(itemsLoading || isComponentLoading) && <Overlay />}
			</Stack.Item>
			<Stack.Item>
				<Stack horizontal style={{ width: "100%", paddingLeft: 8, paddingRight: 8 }}>
					<Stack.Item align="center">
						{stringFormat(
							resources.getString("Label_Grid_Footer_RecordCount"),
							totalResultCount === -1 ? "5000+" : totalResultCount.toString(),
							selection.getSelectedCount().toString()
						)}
					</Stack.Item>
					<Stack.Item grow align="center" style={{ textAlign: "center" }}>
						{!isFullScreen && <Link onClick={onFullScreen}>{resources.getString("Label_ShowFullScreen")}</Link>}
					</Stack.Item>
					<IconButton
						alt="First Page"
						iconProps={{ iconName: "Rewind" }}
						disabled={!hasPreviousPage || isComponentLoading || itemsLoading}
						onClick={onFirstPage}
					/>
					<IconButton
						alt="Previous Page"
						iconProps={{ iconName: "Previous" }}
						disabled={!hasPreviousPage || isComponentLoading || itemsLoading}
						onClick={onPreviousPage}
					/>
					<Stack.Item align="center">
						{stringFormat(
							resources.getString("Label_Grid_Footer"),
							currentPage.toString(),
							selection.getSelectedCount().toString()
						)}
					</Stack.Item>
					<IconButton
						alt="Next Page"
						iconProps={{ iconName: "Next" }}
						disabled={!hasNextPage || isComponentLoading || itemsLoading}
						onClick={onNextPage}
					/>
				</Stack>
			</Stack.Item>

			<StudentModal
				isOpen={modalOpen}
				title={modalMode === "new" ? "Thêm mới Student" : "Cập nhật Student"}
				isEdit={modalMode === "edit"}
				initialData={editingData}
				classOptions={classOptions}
				genderOptions={genderOptions}
				learningStatusOptions={learningStatusOptions}
				onDismiss={() => setModalOpen(false)}
				onSave={handleSave}
			/>
		</Stack>
	);
});

Grid.displayName = "Grid";