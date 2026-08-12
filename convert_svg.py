import os

svg_path = r"c:\Users\hp\Downloads\CNN Project\carcheckup_360_exact_trace_hollow_6_0.svg"
tsx_path = r"c:\Users\hp\Downloads\CNN Project\frontend\src\components\dashboard\ThreeSixtyLogo.tsx"

with open(svg_path, 'r', encoding='utf-8') as f:
    svg_content = f.read()

# Remove the white rect
svg_content = svg_content.replace('<rect width="100%" height="100%" fill="#ffffff"/>', '')
# Replace black fill with currentColor
svg_content = svg_content.replace('fill="#000000"', 'fill="currentColor"')
# Replace fill-rule with fillRule, clip-rule with clipRule
svg_content = svg_content.replace('fill-rule', 'fillRule').replace('clip-rule', 'clipRule')

inner_svg = svg_content.split('<svg')[1].split('>', 1)[1].rsplit('</svg>', 1)[0]

tsx_content = f"""import React from 'react';

export function ThreeSixtyLogo({{ className }}: {{ className?: string }}) {{
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 550" className={{className}}>
{inner_svg}
    </svg>
  );
}}
"""

with open(tsx_path, 'w', encoding='utf-8') as f:
    f.write(tsx_content)
