import * as React from "react";
import { Modal } from "@fluentui/react/lib/Modal";
import { TextField } from "@fluentui/react/lib/TextField";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { DatePicker, defaultDatePickerStrings } from "@fluentui/react/lib/DatePicker";
import { PrimaryButton, DefaultButton } from "@fluentui/react/lib/Button";
import { Stack } from "@fluentui/react/lib/Stack";

export interface StudentFormData {
	id?: string;
	studentCode?: string;
	fullName: string;
	gender?: number;
	birthday?: Date | null;
	learningStatus?: number;
	gpaScore?: number;
	totalCredit?: number;
}

// Bổ sung đầy đủ genderOptions và learningStatusOptions vào interface
export interface StudentModalProps {
	isOpen: boolean;
	title: string;
	isEdit: boolean;
	initialData?: StudentFormData | null;
	genderOptions: IDropdownOption[];
	learningStatusOptions: IDropdownOption[];
	onDismiss: () => void;
	onSave: (data: StudentFormData) => void | Promise<void>;
}

export const StudentModal: React.FC<StudentModalProps> = ({
	isOpen,
	title,
	isEdit,
	initialData,
	genderOptions,
	learningStatusOptions,
	onDismiss,
	onSave,
}) => {
	const [formData, setFormData] = React.useState<StudentFormData>({
		fullName: "",
		studentCode: "",
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
				gender: undefined,
				birthday: null,
				learningStatus: undefined,
				gpaScore: 0,
				totalCredit: 0,
			});
		}
	}, [initialData, isOpen]);

	return (
		<Modal isOpen={isOpen} onDismiss={onDismiss} isBlocking={false}>
			<Stack tokens={{ childrenGap: 12 }} style={{ padding: 24, minWidth: 420, maxWidth: 500 }}>
				<h2>{title}</h2>

				<TextField
					label="Student Code"
					value={formData.studentCode || ""}
					disabled={isEdit}
					onChange={(_, val) => setFormData({ ...formData, studentCode: val || "" })}
				/>

				<TextField
					label="Full Name"
					required
					value={formData.fullName}
					onChange={(_, val) => setFormData({ ...formData, fullName: val || "" })}
				/>

				<Dropdown
					label="Gender"
					options={genderOptions}
					selectedKey={formData.gender}
					onChange={(_, opt) => setFormData({ ...formData, gender: opt?.key as number })}
				/>

				<DatePicker
					label="Birthday"
					strings={defaultDatePickerStrings}
					value={formData.birthday ?? undefined}
					onSelectDate={(date) => setFormData({ ...formData, birthday: date })}
				/>

				<Dropdown
					label="Learning Status"
					required
					options={learningStatusOptions}
					selectedKey={formData.learningStatus}
					onChange={(_, opt) => setFormData({ ...formData, learningStatus: opt?.key as number })}
				/>

				<TextField
					label="GPA Score"
					type="number"
					value={formData.gpaScore !== undefined ? formData.gpaScore.toString() : "0"}
					onChange={(_, val) => setFormData({ ...formData, gpaScore: parseFloat(val || "0") })}
				/>

				<TextField
					label="Total Credit"
					type="number"
					value={formData.totalCredit !== undefined ? formData.totalCredit.toString() : "0"}
					onChange={(_, val) => setFormData({ ...formData, totalCredit: parseInt(val || "0", 10) })}
				/>

				<Stack horizontal tokens={{ childrenGap: 10 }} horizontalAlign="end" style={{ marginTop: 15 }}>
					<PrimaryButton text="Save" onClick={() => void onSave(formData)} />
					<DefaultButton text="Cancel" onClick={onDismiss} />
				</Stack>
			</Stack>
		</Modal>
	);
};