import * as React from "react";
import {
  IObjectWithKey,
  IRenderFunction,
  SelectionMode,
} from "@fluentui/react/lib/Utilities";
import {
  ConstrainMode,
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  IDetailsHeaderProps,
  IDetailsRowProps,
  DetailsRow,
} from "@fluentui/react/lib/DetailsList";
import { Sticky, StickyPositionType } from "@fluentui/react/lib/Sticky";
import { Stack } from "@fluentui/react/lib/Stack";
import { Overlay } from "@fluentui/react/lib/Overlay";
import {
  DefaultButton,
  IconButton,
  PrimaryButton,
} from "@fluentui/react/lib/Button";
import { Icon } from "@fluentui/react/lib/Icon";
import { Text } from "@fluentui/react/lib/Text";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { StudentModal, StudentFormData } from "./StudentModal";

type DataSet = ComponentFramework.PropertyHelper.DataSetApi.EntityRecord &
  IObjectWithKey;

const PAGE_SIZE = 5;

export interface GridProps {
  width?: number;
  height?: number;
  columns: ComponentFramework.PropertyHelper.DataSetApi.Column[];
  records: Record<
    string,
    ComponentFramework.PropertyHelper.DataSetApi.EntityRecord
  >;
  sortedRecordIds: string[];
  itemsLoading: boolean;
  highlightValue: string | null;
  highlightColor: string | null;
  classOptions: IDropdownOption[];
  genderOptions: IDropdownOption[];
  learningStatusOptions: IDropdownOption[];
  setSelectedRecords: (ids: string[]) => void;
  onNavigate: (
    item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
  ) => void;
  onCreateRecord: (data: StudentFormData) => Promise<void>;
  onUpdateRecord: (id: string, data: StudentFormData) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
}

const onRenderDetailsHeader: IRenderFunction<IDetailsHeaderProps> = (
  props,
  defaultRender,
) => {
  if (props && defaultRender) {
    return (
      <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced>
        <div
          style={{
            backgroundColor: "#faf9f8",
            borderBottom: "1px solid #edebe9",
          }}
        >
          {defaultRender({
            ...props,
            styles: {
              root: {
                paddingTop: 0,
                height: 42,
                lineHeight: "42px",
                selectors: {
                  ".ms-DetailsHeader-cell": {
                    fontWeight: "600",
                    color: "#323130",
                    fontSize: "13px",
                  },
                },
              },
            },
          })}
        </div>
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
    onNavigate,
    onCreateRecord,
    onUpdateRecord,
    onDeleteRecord,
  } = props;

  const [isComponentLoading, setIsLoading] = React.useState<boolean>(false);
  const [currentPage, setCurrentPage] = React.useState<number>(1);

  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const [modalMode, setModalMode] = React.useState<"new" | "edit" | "view">(
    "new",
  );
  const [editingData, setEditingData] = React.useState<StudentFormData | null>(
    null,
  );

  const totalPages = Math.ceil(sortedRecordIds.length / PAGE_SIZE) || 1;

  const pagedRecordIds = React.useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return sortedRecordIds.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedRecordIds, currentPage]);

  const items: (DataSet | undefined)[] = React.useMemo(() => {
    setIsLoading(false);
    return pagedRecordIds.map((id) => records[id]);
  }, [records, pagedRecordIds]);

  const parseOptionSetValue = (
    record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
    fieldName: string,
  ): number | undefined => {
    const rawVal = record.getValue(fieldName);
    if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
      const parsed = Number(rawVal);
      if (!isNaN(parsed)) return parsed;
    }
    return undefined;
  };

  const getStudentFormData = React.useCallback(
    (recordId: string): StudentFormData => {
      const record = records[recordId];
      const rawBirthday =
        (record.getValue("ksvc_dat_birthday") as string) || null;
      const rawClass = record.getValue("ksvc_lup_class") as
        | ComponentFramework.EntityReference
        | undefined;

      return {
        id: recordId,
        studentCode:
          (record.getValue("ksvc_slt_studentcode") as string) ||
          record.getFormattedValue("ksvc_slt_studentcode") ||
          "",
        fullName:
          (record.getValue("ksvc_slt_studentname") as string) ||
          record.getFormattedValue("ksvc_slt_studentname") ||
          "",
        classId:
          rawClass?.id?.guid ||
          (rawClass?.id as unknown as string) ||
          "",
        gender: parseOptionSetValue(record, "ksvc_opt_gender"),
        birthday: rawBirthday ? new Date(rawBirthday) : null,
        learningStatus: parseOptionSetValue(record, "ksvc_opt_learningstatus") ? parseOptionSetValue(record, "ksvc_opt_learningstatus")! : 0,
        gpaScore: (record.getValue("ksvc_dcn_gpascore") as number) ?? 0,
        totalCredit: (record.getValue("ksvc_int_toltalcredit") as number) ?? 0,
      };
    },
    [records],
  );

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
    [getStudentFormData],
  );

  const handleOpenView = React.useCallback(
    (id: string) => {
      setModalMode("view");
      setEditingData(getStudentFormData(id));
      setModalOpen(true);
    },
    [getStudentFormData],
  );

  const handleDelete = React.useCallback(
    async (id: string) => {
      if (confirm("Bạn có chắc chắn muốn xoá bản ghi sinh viên này?")) {
        setIsLoading(true);
        await onDeleteRecord(id);
        setIsLoading(false);
      }
    },
    [onDeleteRecord],
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
    [modalMode, editingData, onCreateRecord, onUpdateRecord],
  );

  const gridColumns: IColumn[] = React.useMemo(() => {
    const dataCols: IColumn[] = columns
      .filter((col) => !col.isHidden && col.order >= 0)
      .sort((a, b) => a.order - b.order)
      .map((col) => {
        let minWidth = 70;
        let flexGrow = 1;

        if (col.name === "ksvc_slt_studentname") {
          minWidth = 110;
          flexGrow = 2;
        } else if (col.name === "ksvc_slt_studentcode") {
          minWidth = 90;
        } else if (col.name === "ksvc_opt_learningstatus") {
          minWidth = 95;
        } else if (
          col.name === "ksvc_dcn_gpascore" ||
          col.name === "ksvc_int_toltalcredit"
        ) {
          minWidth = 65;
        }

        return {
          key: col.name,
          name: col.displayName,
          fieldName: col.name,
          minWidth,
          flexGrow,
          isResizable: true,
          onRender: (
            item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
          ) => {
            if (!item) return null;
            const val = item.getFormattedValue(col.name);
            return (
              <span
                style={{
                  fontSize: "13px",
                  color: "#323130",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {val || "—"}
              </span>
            );
          },
        };
      });

    const actionCol: IColumn = {
      key: "actions",
      name: "Actions",
      minWidth: 95,
      maxWidth: 105,
      isResizable: false,
      onRender: (
        item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
      ) => {
        if (!item) return null;
        const id = item.getRecordId();
        return (
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 2 }}>
            <IconButton
              iconProps={{ iconName: "View" }}
              title="View Detail"
              ariaLabel="View"
              styles={{
                root: { width: 26, height: 26, color: "#0078d4" },
                rootHovered: { backgroundColor: "#deecf9", color: "#005a9e" },
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenView(id);
              }}
            />
            <IconButton
              iconProps={{ iconName: "Edit" }}
              title="Edit Record"
              ariaLabel="Edit"
              styles={{
                root: { width: 26, height: 26, color: "#107c41" },
                rootHovered: { backgroundColor: "#dff6dd", color: "#0b5a30" },
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(id);
              }}
            />
            <IconButton
              iconProps={{ iconName: "Delete" }}
              title="Delete Record"
              ariaLabel="Delete"
              styles={{
                root: { width: 26, height: 26, color: "#a80000" },
                rootHovered: { backgroundColor: "#fde7e9", color: "#740000" },
              }}
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

  const onRenderRow = (
    rowProps?: IDetailsRowProps,
  ): React.JSX.Element | null => {
    if (!rowProps) return null;
    return (
      <DetailsRow
        {...rowProps}
        styles={{
          root: {
            fontSize: "13px",
            minHeight: 44,
            lineHeight: "44px",
            borderBottom: "1px solid #f3f2f1",
            selectors: {
              ":hover": {
                backgroundColor: "#f8f8f8",
              },
            },
          },
        }}
      />
    );
  };

  const visiblePageNumbers = React.useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let startPage = currentPage - 2;
    let endPage = currentPage + 2;

    if (startPage < 1) {
      startPage = 1;
      endPage = maxButtons;
    }

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = totalPages - maxButtons + 1;
    }

    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: height === -1 ? "100%" : height || "100%",
        width: width || "100%",
        maxHeight: "100%",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        fontFamily:
          "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif",
      }}
    >
      {/* 1. Header Toolbar (Cố định ở trên cùng) */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 16px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #edebe9",
        }}
      >
        <PrimaryButton
          iconProps={{ iconName: "Add" }}
          text="New Student"
          onClick={handleOpenNew}
          styles={{
            root: {
              borderRadius: 2,
              padding: "0 14px",
              height: 32,
              fontWeight: 600,
            },
          }}
        />
      </div>

      {/* 2. Main Grid View (Tự co giãn trong khoảng giữa) */}
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          position: "relative",
          backgroundColor: "#ffffff",
        }}
      >
        {!itemsLoading && !isComponentLoading && items.length === 0 && (
          <Stack
            grow
            horizontalAlign="center"
            verticalAlign="center"
            style={{
              width: "100%",
              padding: "40px 0",
            }}
          >
            <Icon
              iconName="PageList"
              style={{ fontSize: 32, color: "#a19f9d", marginBottom: 6 }}
            />
            <Text
              variant="medium"
              style={{ color: "#605e5c", fontWeight: 500 }}
            >
              No student records found
            </Text>
          </Stack>
        )}

        <DetailsList
          columns={gridColumns}
          onRenderDetailsHeader={onRenderDetailsHeader}
          onRenderRow={onRenderRow}
          items={items}
          setKey={`page_${currentPage}`}
          selectionMode={SelectionMode.none}
          onItemInvoked={onNavigate}
          layoutMode={DetailsListLayoutMode.justified}
          constrainMode={ConstrainMode.horizontalConstrained}
        />
        {(itemsLoading || isComponentLoading) && <Overlay />}
      </div>

      {/* 3. Bottom Pagination Footer (Cố định ở đáy màn hình) */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 16px",
          backgroundColor: "#faf9f8",
          borderTop: "1px solid #edebe9",
        }}
      >
        <Text style={{ fontSize: "13px", color: "#605e5c" }}>
          Total: <strong>{sortedRecordIds.length}</strong> records (Page{" "}
          {currentPage} of {totalPages})
        </Text>

        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
          <IconButton
            iconProps={{ iconName: "Rewind" }}
            title="First Page"
            disabled={currentPage === 1 || isComponentLoading || itemsLoading}
            onClick={() => setCurrentPage(1)}
            styles={{ root: { width: 30, height: 30 } }}
          />
          <IconButton
            iconProps={{ iconName: "Previous" }}
            title="Previous Page"
            disabled={currentPage === 1 || isComponentLoading || itemsLoading}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            styles={{ root: { width: 30, height: 30 } }}
          />
          {visiblePageNumbers.map((i) => {
            const isCurrent = i === currentPage;
            return (
              <DefaultButton
                key={i}
                text={String(i)}
                title={`Page ${i}`}
                disabled={isComponentLoading || itemsLoading}
                onClick={() => setCurrentPage(i)}
                styles={{
                  root: {
                    minWidth: 30,
                    width: 30,
                    height: 30,
                    padding: 0,
                    borderRadius: 2,
                    backgroundColor: isCurrent ? "#0078d4" : "transparent",
                    borderColor: isCurrent ? "#0078d4" : "#e1dfdd",
                    color: isCurrent ? "#ffffff" : "#323130",
                    fontWeight: isCurrent ? "600" : "normal",
                  },
                  rootHovered: {
                    backgroundColor: isCurrent ? "#106ebe" : "#f3f2f1",
                    color: isCurrent ? "#ffffff" : "#323130",
                  },
                }}
              />
            );
          })}
          <IconButton
            iconProps={{ iconName: "Next" }}
            title="Next Page"
            disabled={
              currentPage >= totalPages || isComponentLoading || itemsLoading
            }
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            styles={{ root: { width: 30, height: 30 } }}
          />
          <IconButton
            iconProps={{ iconName: "FastForward" }}
            title="Last Page"
            disabled={
              currentPage >= totalPages || isComponentLoading || itemsLoading
            }
            onClick={() => setCurrentPage(totalPages)}
            styles={{ root: { width: 30, height: 30 } }}
          />
        </Stack>
      </div>

      <StudentModal
        isOpen={modalOpen}
        title={
          modalMode === "new"
            ? "Thêm mới Student"
            : modalMode === "edit"
              ? "Cập nhật Student"
              : "Chi tiết Student"
        }
        mode={modalMode}
        initialData={editingData}
        classOptions={classOptions}
        genderOptions={genderOptions}
        learningStatusOptions={learningStatusOptions}
        onDismiss={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
});

Grid.displayName = "Grid";
