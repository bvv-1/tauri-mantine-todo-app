import { Combobox, Group, Input, InputBase, useCombobox } from "@mantine/core";
import { useState } from "react";
import { useTodosContext } from "../contexts/TodosContext";

export function CreatableSectionSelect({
  value,
  onChange,
}: {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
}) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const { sections, createSection } = useTodosContext();
  const [search, setSearch] = useState("");

  const exactOptionFound = sections.some((item) => item.name === search);
  const selectedOption = sections.find((item) => item.id === value);

  const handleValueSelect = (val: string | null) => {
    if (val === "create") {
      createSection(search).then((newSection) => {
        onChange(newSection.id);
        combobox.closeDropdown();
      });
    } else {
      onChange(val ? Number(val) : null);
      combobox.closeDropdown();
    }
  };

  const options = sections
    .filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase().trim()),
    )
    .map((item) => (
      <Combobox.Option value={item.id.toString()} key={item.id}>
        {item.name}
      </Combobox.Option>
    ));

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={handleValueSelect}
    >
      <Combobox.Target>
        <Input.Wrapper label="セクション" mt="md">
          <InputBase
            rightSection={<Combobox.Chevron />}
            value={selectedOption ? selectedOption.name : search}
            onChange={(event) => {
              combobox.openDropdown();
              combobox.updateSelectedOptionIndex();
              setSearch(event.currentTarget.value);
            }}
            onClick={() => combobox.openDropdown()}
            onFocus={() => combobox.openDropdown()}
            onBlur={() => {
              combobox.closeDropdown();
              setSearch(selectedOption ? selectedOption.name : "");
            }}
            placeholder="セクションを選択または作成"
          />
        </Input.Wrapper>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options}
          {!exactOptionFound && search.trim().length > 0 && (
            <Combobox.Option value="create">
              <Group gap="xs">
                <span>+ 作成:</span>
                <span>{search}</span>
              </Group>
            </Combobox.Option>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
