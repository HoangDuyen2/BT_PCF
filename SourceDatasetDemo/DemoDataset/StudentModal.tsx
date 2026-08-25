import * as React from "react";
import { Modal, IModalStyles } from "@fluentui/react/lib/Modal";
import { TextField } from "@fluentui/react/lib/TextField";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import {
  DatePicker,
  defaultDatePickerStrings,
} from "@fluentui/react/lib/DatePicker";
import {
  PrimaryButton,
  DefaultButton,
  IconButton,
} from "@fluentui/react/lib/Button";
import { Stack } from "@fluentui/react/lib/Stack";

export interface StudentFormData {
  id?: string;
  studentCode?: string;
  fullName: string;
  classId?: string;
  gender?: number;
  birthday?: Date | null;
  learningStatus?: number;
  gpaScore?: number;
  totalCredit?: number;
}

export interface StudentModalProps {
  isOpen: boolean;
  title: string;
  mode: "new" | "edit" | "view";
  initialData?: StudentFormData | null;
  classOptions: IDropdownOption[];
  genderOptions: IDropdownOption[];
  learningStatusOptions: IDropdownOption[];
  onDismiss: () => void;
  onSave: (data: StudentFormData) => void | Promise<void>;
}

const modalStyles: Partial<IModalStyles> = {
  main: {
    width: 600,
    maxWidth: "90vw",
    maxHeight: "85vh",
    borderRadius: 4,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  scrollableContent: {
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
};

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  title,
  mode,
  initialData,
  classOptions,
  genderOptions,
  learningStatusOptions,
  onDismiss,
  onSave,
}) => {
  const isReadOnly = mode === "view";

  const [formData, setFormData] = React.useState<StudentFormData>({
    fullName: "",
    studentCode: "",
    classId: undefined,
    gender: undefined,
    birthday: null,
    learningStatus: undefined,
    gpaScore: 0,
    totalCredit: 0,
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        fullName: "",
        studentCode: "",
        classId: undefined,
        gender: undefined,
        birthday: null,
        learningStatus: undefined,
        gpaScore: 0,
        totalCredit: 0,
      });
    }
  }, [initialData, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      isBlocking={false}
      styles={modalStyles}
    >
      {/* Header */}
      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="center"
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #edebe9",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600 }}>
          {title}
        </h2>
        <IconButton
          iconProps={{ iconName: "Cancel" }}
          ariaLabel="Close popup"
          onClick={onDismiss}
        />
      </Stack>

      <Stack
        tokens={{ childrenGap: 12 }}
        style={{
          padding: "20px 24px",
          overflowY: "auto",
        }}
      >
        <Stack horizontal tokens={{ childrenGap: 16 }}>
          <Stack.Item grow={1} style={{ width: "50%" }}>
            <TextField
              label="Student Code"
              value={formData.studentCode || ""}
              disabled={true}
              placeholder="Tự động sinh"
              onChange={(_, val) =>
                setFormData({ ...formData, studentCode: val || "" })
              }
            />
          </Stack.Item>
          <Stack.Item grow={1} style={{ width: "50%" }}>
            <TextField
              label="Full Name"
              required
              disabled={isReadOnly}
              value={formData.fullName}
              onChange={(_, val) =>
                setFormData({ ...formData, fullName: val || "" })
              }
            />
          </Stack.Item>
        </Stack>

        <Stack horizontal tokens={{ childrenGap: 16 }}>
          <Stack.Item grow={1} style={{ width: "50%" }}>
            <Dropdown
              label="Class"
              required
              disabled={isReadOnly}
              placeholder="Chọn lớp"
              options={classOptions}
              selectedKey={formData.classId}
              onChange={(_, opt) =>
                setFormData({ ...formData, classId: opt?.key as string })
              }
            />
          </Stack.Item>
          <Stack.Item grow={1} style={{ width: "50%" }}>
            <Dropdown
              label="Gender"
              disabled={isReadOnly}
              placeholder="Chọn giới tính"
              options={genderOptions}
              selectedKey={(formData.gender as number) ?? undefined}
              onChange={(_, opt) =>
                setFormData({ ...formData, gender: opt?.key as number })
              }
            />
          </Stack.Item>
        </Stack>

        <Stack horizontal tokens={{ childrenGap: 16 }}>
          <Stack.Item grow={1} style={{ width: "50%" }}>
            <DatePicker
              label="Birthday"
              disabled={isReadOnly}
              strings={defaultDatePickerStrings}
              value={formData.birthday ?? undefined}
              onSelectDate={(date) =>
                setFormData({ ...formData, birthday: date })
              }
              formatDate={(date) => {
                if (!date) return "";
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, "0");
                const day = date.getDate().toString().padStart(2, "0");
                return `${year}-${month}-${day}`;
              }}
            />
          </Stack.Item>
          <Stack.Item grow={1} style={{ width: "50%" }}>
            <Dropdown
              label="Learning Status"
              required
              disabled={isReadOnly}
              placeholder="Chọn trạng thái"
              options={learningStatusOptions}
              selectedKey={(formData.learningStatus as number) ?? undefined}
              onChange={(_, opt) =>
                setFormData({ ...formData, learningStatus: opt?.key as number })
              }
            />
          </Stack.Item>
        </Stack>

        <Stack horizontal tokens={{ childrenGap: 16 }}>
          <Stack.Item grow={1} style={{ width: "50%" }}>
            <TextField
              label="GPA Score"
              type="number"
              disabled={isReadOnly}
              value={
                formData.gpaScore !== undefined && formData.gpaScore !== null
                  ? String(formData.gpaScore)
                  : ""
              }
              onChange={(_, val) =>
                setFormData({
                  ...formData,
                  gpaScore: val === "" ? undefined : parseFloat(val || "0"),
                })
              }
            />
          </Stack.Item>
          <Stack.Item grow={1} style={{ width: "50%" }}>
            <TextField
              label="Total Credit"
              type="number"
              disabled={isReadOnly}
              value={
                formData.totalCredit !== undefined &&
                formData.totalCredit !== null
                  ? String(formData.totalCredit)
                  : ""
              }
              onChange={(_, val) =>
                setFormData({
                  ...formData,
                  totalCredit:
                    val === "" ? undefined : parseInt(val || "0", 10),
                })
              }
            />
          </Stack.Item>
        </Stack>
      </Stack>

      {/* Footer Actions */}
      <Stack
        horizontal
        tokens={{ childrenGap: 10 }}
        horizontalAlign="end"
        style={{
          padding: "16px 24px",
          borderTop: "1px solid #edebe9",
          backgroundColor: "#fcfcfc",
        }}
      >
        {!isReadOnly && (
          <PrimaryButton text="Save" onClick={() => void onSave(formData)} />
        )}
        <DefaultButton
          text={isReadOnly ? "Close" : "Cancel"}
          onClick={onDismiss}
        />
      </Stack>
    </Modal>
  );
};