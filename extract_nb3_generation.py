import json
import os

with open('notebooks/03_repair_cost_prediction.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

with open('generation_logic.txt', 'w', encoding='utf-8') as out:
    for i, cell in enumerate(nb['cells']):
        if cell['cell_type'] == 'code':
            source = "".join(cell['source'])
            if "np.random" in source or "pd.DataFrame" in source or "df" in source or "generate" in source:
                out.write(f"--- Cell {i} ---\n")
                out.write(source)
                out.write("\n--------------------\n")
