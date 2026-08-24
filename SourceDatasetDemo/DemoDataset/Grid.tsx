import * as React from "react";
import { useConst, useForceUpdate } from "@fluentui/react-hooks";
import { IObjectWithKey, IRenderFunction, SelectionMode } from "@fluentui/react/lib/Utilities";
import {
	ConstrainMode,
	DetailsList,
	DetailsListLayoutMode,
	IColumn,
	IDetailsHeaderProps,
} from "@fluentui/react/lib/DetailsList";
import { Sticky, StickyPositionType } from "@fluentui/react/lib/Sticky";
import { ScrollablePane, ScrollbarVisibility } from "@fluentui/react/lib/ScrollablePane";
import { Stack } from "@fluentui/react/lib/Stack";
import { Overlay } from "@fluentui/react/lib/Overlay";
import { IconButton, PrimaryButton } from "@fluentui/react/lib/Button";
import { Selection } from "@fluentui/react/lib/Selection";
import { Icon } from "@fluentui/react/lib/Icon";
import { Text } from "@fluentui/react/lib/Text";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { StudentModal, StudentFormData } from "./StudentModal";

type DataSet = ComponentFramework.PropertyHelper.DataSetApi.EntityRecord & IObjectWithKey;

const PAGE_SIZE = 5;

export interface GridProps {
	width?: number;
	height?: number;
	columns: ComponentFramework.PropertyHelper.DataSetApi.Column[];
	records: Record<string, ComponentFramework.PropertyHelper.DataSetApi.EntityRecord>;
	sortedRecordIds: string[];
	itemsLoading: boolean;
	highlightValue: string | null;
	highlightColor: string | null;
	classOptions: IDropdownOption[];
	genderOptions: IDropdownOption[];
	learningStatusOptions: IDropdownOption[];
	setSelectedRecords: (ids: string[]) => void;
	onNavigate: (item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord) => void;
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

export const Grid = React.memo((props: GridProps) => {
	const {
		records,
		sortedRecordIds,
		columns,
		width,
		height,
		itemsLoading,
		classOptions,
		genderOptions,
		learningStatusOptions,
		setSelectedRecords,
		onNavigate,
		onCreateRecord,
		onUpdateRecord,
		onDeleteRecord,
	} = props;

	const forceUpdate = useForceUpdate();
	const [isComponentLoading, setIsLoading] = React.useState<boolean>(false);
	const [currentPage, setCurrentPage] = React.useState<number>(1);

	const [modalOpen, setModalOpen] = React.useState<boolean>(false);
	const [modalMode, setModalMode] = React.useState<"new" | "edit" | "view">("new");
	const [editingData, setEditingData] = React.useState<StudentFormData | null>(null);

	const onSelectionChanged = React.useCallback(() => {
		const selectedIndices = selection.getSelectedIndices();
		if (selectedIndices.length > 0) {
			const currentId = sortedRecordIds[selectedIndices[0]];
			setSelectedRecords([currentId]);
		} else {
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

	// Phân trang
	const totalPages = Math.ceil(sortedRecordIds.length / PAGE_SIZE) || 1;

	const pagedRecordIds = React.useMemo(() => {
		const startIndex = (currentPage - 1) * PAGE_SIZE;
		return sortedRecordIds.slice(startIndex, startIndex + PAGE_SIZE);
	}, [sortedRecordIds, currentPage]);

	const items: (DataSet | undefined)[] = React.useMemo(() => {
		setIsLoading(false);
		return pagedRecordIds.map((id) => records[id]);
	}, [records, pagedRecordIds]);

	const getStudentFormData = React.useCallback(
		(recordId: string): StudentFormData => {
			const record = records[recordId];
			const rawBirthday = (record.getValue("ksvc_dat_birthday") as string) || null;
			const rawClass = record.getValue("ksvc_lup_class") as ComponentFramework.EntityReference | undefined;

			return {
				id: recordId,
				studentCode: (record.getValue("ksvc_slt_studentcode") as string) || "",
				fullName: (record.getValue("ksvc_slt_studentname") as string) || "",
				classId: rawClass?.id?.guid || (rawClass?.id as unknown as string) || undefined,
				gender: parseOptionSetValue(record, "ksvc_opt_gender"),
				birthday: rawBirthday ? new Date(rawBirthday) : null,
				learningStatus: parseOptionSetValue(record, "ksvc_opt_learningstatus"),
				gpaScore: (record.getValue("ksvc_dcn_gpascore") as number) ?? 0,
				totalCredit: (record.getValue("ksvc_int_toltalcredit") as number) ?? 0,
			};
		},
		[records]
	);

	const parseOptionSetValue = (
		record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
		fieldName: string
	): number | undefined => {
		const rawVal = record.getValue(fieldName);
		if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
			const parsed = Number(rawVal);
			if (!isNaN(parsed)) return parsed;
		}
		return undefined;
	};

	const handleOpenNew = React.useCallback(() => {
		setModalMode("new");
		setEditingData(null);
		setModalOpen(true);
	}, []);

	const handleOpenEdit = React.useCallback(
		(id: string) => {
			setModalMode("edit");
			setEditingData(getStudentFormData(id));
			setModalOpen(true);
		},
		[getStudentFormData]
	);

	const handleOpenView = React.useCallback(
		(id: string) => {
			setModalMode("view");
			setEditingData(getStudentFormData(id));
			setModalOpen(true);
		},
		[getStudentFormData]
	);

	const handleDelete = React.useCallback(
		async (id: string) => {
			if (confirm("Bạn có chắc chắn muốn xoá bản ghi này?")) {
				setIsLoading(true);
				await onDeleteRecord(id);
				selection.setAllSelected(false);
				setIsLoading(false);
			}
		},
		[onDeleteRecord, selection]
	);

	const handleSave = React.useCallback(
		async (data: StudentFormData) => {
			setIsLoading(true);
			if (modalMode === "new") {
				await onCreateRecord(data);
			} else if (modalMode === "edit" && editingData?.id) {
				await onUpdateRecord(editingData.id, data);
			}
			setModalOpen(false);
			setIsLoading(false);
		},
		[modalMode, editingData, onCreateRecord, onUpdateRecord]
	);

	const gridColumns: IColumn[] = React.useMemo(() => {
		const dataCols: IColumn[] = columns
			.filter((col) => !col.isHidden && col.order >= 0)
			.sort((a, b) => a.order - b.order)
			.map((col) => ({
				key: col.name,
				name: col.displayName,
				fieldName: col.name,
				minWidth: col.visualSizeFactor > 100 ? col.visualSizeFactor : 100,
				isResizable: true,
			}));

		// Cột Action chứa nút View, Edit, Delete
		const actionCol: IColumn = {
			key: "actions",
			name: "Actions",
			minWidth: 120,
			maxWidth: 140,
			isResizable: false,
			onRender: (item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord) => {
				if (!item) return null;
				const id = item.getRecordId();
				return (
					<Stack horizontal tokens={{ childrenGap: 4 }}>
						<IconButton
							iconProps={{ iconName: "View" }}
							title="View"
							ariaLabel="View"
							onClick={(e) => {
								e.stopPropagation();
								handleOpenView(id);
							}}
						/>
						<IconButton
							iconProps={{ iconName: "Edit" }}
							title="Edit"
							ariaLabel="Edit"
							onClick={(e) => {
								e.stopPropagation();
								handleOpenEdit(id);
							}}
						/>
						<IconButton
							iconProps={{ iconName: "Delete" }}
							title="Delete"
							ariaLabel="Delete"
							onClick={(e) => {
								e.stopPropagation();
								void handleDelete(id);
							}}
						/>
					</Stack>
				);
			},
		};

		return [...dataCols, actionCol];
	}, [columns, handleOpenView, handleOpenEdit, handleDelete]);

	const onRenderItemColumn = (
		item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
		index?: number,
		column?: IColumn
	) => {
		if (!item || !column) return null;
		if (column.key === "actions" && column.onRender) {
			return column.onRender(item, index, column);
		}
		if (column.fieldName) {
			return <>{item.getFormattedValue(column.fieldName)}</>;
		}
		return null;
	};

	const rootContainerStyle: React.CSSProperties = React.useMemo(() => {
		return {
			height: height === -1 ? "100%" : height,
			width: width,
		};
	}, [width, height]);

	return (
		<Stack verticalFill grow style={rootContainerStyle}>
			<Stack horizontal style={{ padding: "6px 8px", background: "#f3f2f1", borderBottom: "1px solid #e1dfdd" }}>
				<PrimaryButton iconProps={{ iconName: "Add" }} text="New" onClick={handleOpenNew} />
			</Stack>

			<Stack.Item grow style={{ position: "relative", backgroundColor: "white", zIndex: 0 }}>
				{!itemsLoading && !isComponentLoading && items.length === 0 && (
					<Stack grow horizontalAlign="center" style={{ position: "absolute", width: "100%", top: 80, fontSize: "200%" }}>
						<Icon iconName="PageList" />
						<Text variant="large">No records found</Text>
					</Stack>
				)}
				<ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
					<DetailsList
						columns={gridColumns}
						onRenderItemColumn={onRenderItemColumn}
						onRenderDetailsHeader={onRenderDetailsHeader}
						items={items}
						setKey={`page_${currentPage}`}
						selectionMode={SelectionMode.single}
						selection={selection}
						onItemInvoked={onNavigate}
						layoutMode={DetailsListLayoutMode.fixedColumns}
						constrainMode={ConstrainMode.unconstrained}
					/>
				</ScrollablePane>
				{(itemsLoading || isComponentLoading) && <Overlay />}
			</Stack.Item>
			<Stack.Item>
				<Text>{`Total records: ${sortedRecordIds.length} records`}</Text>
			</Stack.Item>
			{/* Thanh điều khiển phân trang*/}
			<Stack.Item>
				<Stack horizontal horizontalAlign="center" verticalAlign="center" tokens={{ childrenGap: 10 }} style={{ padding: 8, borderTop: "1px solid #e1dfdd" }}>
					<IconButton
						iconProps={{ iconName: "Rewind" }}
						title="First Page"
						disabled={currentPage === 1 || isComponentLoading || itemsLoading}
						onClick={() => setCurrentPage(1)}
					/>
					<IconButton
						iconProps={{ iconName: "Previous" }}
						title="Previous Page"
						disabled={currentPage === 1 || isComponentLoading || itemsLoading}
						onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
					/>
					{Array.from({ length: totalPages }, (_, index) => index + 1)
						.map((i) => {
							console.log("Page number:", i);
							return (
							<IconButton
								key={i}
								text={String(i)}
								title={`Page ${i}`}
								disabled={isComponentLoading || itemsLoading}
								onClick={() => setCurrentPage(i)}
							/>
							);
						})
					}
					<IconButton
						iconProps={{ iconName: "Next" }}
						title="Next Page"
						disabled={currentPage >= totalPages || isComponentLoading || itemsLoading}
						onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
					/>
					<IconButton
						iconProps={{ iconName: "FastForward" }}
						title="Last Page"
						disabled={currentPage >= totalPages || isComponentLoading || itemsLoading}
						onClick={() => setCurrentPage(totalPages)}
					/>
				</Stack>
			</Stack.Item>

			<StudentModal
				isOpen={modalOpen}
				title={modalMode === "new" ? "Thêm mới Student" : modalMode === "edit" ? "Cập nhật Student" : "Chi tiết Student"}
				mode={modalMode}
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