import json

with open('03_repair_cost_prediction.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

with open('nb3_cells.txt', 'w', encoding='utf-8') as out:
    for i, cell in enumerate(nb.get('cells', [])):
        if cell['cell_type'] == 'code':
            source = "".join(cell.get('source', []))
            if 'joblib.dump' in source or 'xgb' in source or 'Pipeline' in source:
                out.write(f"--- Cell {i} ---\n")
                out.write(source + "\n")
                out.write("-" * 20 + "\n")
