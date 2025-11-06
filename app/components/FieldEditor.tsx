import React from "react";

type FieldName = "fio" | "course" | "id";
type Align = "left" | "center" | "right";
export type FieldBox = { name: FieldName; x: number; y: number; w: number; h: number; align: Align };

export default function FieldEditor({
  boxes,
  setBoxes,
  activeField,
  setActiveField,
  align,
  setAlign,
  onSave,
  onBack,
}: {
  boxes: FieldBox[];
  setBoxes: React.Dispatch<React.SetStateAction<FieldBox[]>>;
  activeField: FieldName;
  setActiveField: (v: FieldName) => void;
  align: Align;
  setAlign: (v: Align) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  const FIELD_LABEL: Record<FieldName, string> = { fio: "ФИО", course: "Курс", id: "ID" };

  const setBoxNumeric = (name: FieldName, key: keyof Omit<FieldBox, "name" | "align">, value: number) => {
    setBoxes((prev) => prev.map((b) => (b.name === name ? { ...b, [key]: Math.max(0, Math.round(value)) } : b)));
  };
  const setBoxAlign = (name: FieldName, value: Align) => {
    setBoxes((prev) => prev.map((b) => (b.name === name ? { ...b, align: value } : b)));
  };

  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm">
      <h3 className="font-semibold mb-2">Инструменты</h3>
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <label className="text-sm w-24">Поле</label>
          <select value={activeField} onChange={(e) => setActiveField(e.target.value as FieldName)} className="px-2 py-1 border rounded-md">
            <option value="fio">ФИО</option>
            <option value="course">Курс</option>
            <option value="id">ID</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm w-24">Выравнивание</label>
          <select value={align} onChange={(e) => setAlign(e.target.value as Align)} className="px-2 py-1 border rounded-md">
            <option value="left">Слева</option>
            <option value="center">По центру</option>
            <option value="right">Справа</option>
          </select>
        </div>

        {(["fio", "course", "id"] as FieldName[]).map((key) => {
          const b = boxes.find((x) => x.name === key);
          return (
            <div key={key} className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-16 font-medium">{FIELD_LABEL[key]}</div>
                <div className="ml-auto text-xs text-gray-500">пиксели в координатах исходного изображения</div>
              </div>
              {b ? (
                <div className="text-sm">
                  <label className="flex items-center gap-2">
                    <span className="w-6">x</span>
                    <input type="number" className="flex-1 px-2 py-1 border rounded" value={b.x} onChange={(e) => setBoxNumeric(key, "x", Number(e.target.value))} />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-6">y</span>
                    <input type="number" className="flex-1 px-2 py-1 border rounded" value={b.y} onChange={(e) => setBoxNumeric(key, "y", Number(e.target.value))} />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-6">w</span>
                    <input type="number" className="flex-1 px-2 py-1 border rounded" value={b.w} onChange={(e) => setBoxNumeric(key, "w", Number(e.target.value))} />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-6">h</span>
                    <input type="number" className="flex-1 px-2 py-1 border rounded" value={b.h} onChange={(e) => setBoxNumeric(key, "h", Number(e.target.value))} />
                  </label>
                  <label className="flex items-center gap-2 col-span-2">
                    <span className="w-20">align</span>
                    <select className="px-2 py-1 border rounded" value={b.align} onChange={(e) => setBoxAlign(key, e.target.value as Align)}>
                      <option value="left">left</option>
                      <option value="center">center</option>
                      <option value="right">right</option>
                    </select>
                  </label>
                  <div className="col-span-2 flex justify-end">
                    <button className="text-red-600 hover:underline" onClick={() => setBoxes((prev) => prev.filter((p) => p.name !== key))}>
                      Удалить зону
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">не задано — нарисуй на холсте или введи координаты (после первого рисования появятся поля)</div>
              )}
            </div>
          );
        })}

        <div className="pt-2 flex gap-2">
          <button className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={onBack}>
            ← Назад
          </button>
          <button className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50" onClick={onSave} disabled={!boxes.length}>
            Сохранить поля
          </button>
        </div>
      </div>
    </div>
  );
}
