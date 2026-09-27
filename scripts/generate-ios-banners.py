#!/usr/bin/env python3
"""
Generate 1284 x 2778 px App Store Connect screenshots for iOS (iPhone 6.7" Super Retina XDR).
Preserves 3D clay aesthetic, Bé Khóa mascot, and smooth brand gradient.
"""

import os
import subprocess

def process_banner(in_path, out_path, top_pad=220, bot_pad=275):
    scaled_w = 1284
    scaled_h = 2283
    tmp_scaled = '/tmp/scaled_ios.ppm'
    tmp_out = '/tmp/out_ios.ppm'
    
    # Scale width to 1284 maintaining aspect ratio
    subprocess.check_call(['magick', in_path, '-resize', f'{scaled_w}x{scaled_h}!', tmp_scaled])
    
    with open(tmp_scaled, 'rb') as f:
        f.readline() # P6
        dim = f.readline().split()
        while dim[0].startswith(b'#'):
            dim = f.readline().split()
        w, h = int(dim[0]), int(dim[1])
        f.readline() # 255
        raw_scaled = bytearray(f.read())
        
    out_h = top_pad + scaled_h + bot_pad # 220 + 2283 + 275 = 2778
    raw_out = bytearray(w * out_h * 3)
    
    # 1. Top gradient extrapolation
    r0 = sum(raw_scaled[(0 * w + x)*3] for x in range(w)) / float(w)
    g0 = sum(raw_scaled[(0 * w + x)*3 + 1] for x in range(w)) / float(w)
    b0 = sum(raw_scaled[(0 * w + x)*3 + 2] for x in range(w)) / float(w)
    
    r60 = sum(raw_scaled[(60 * w + x)*3] for x in range(w)) / float(w)
    g60 = sum(raw_scaled[(60 * w + x)*3 + 1] for x in range(w)) / float(w)
    b60 = sum(raw_scaled[(60 * w + x)*3 + 2] for x in range(w)) / float(w)
    
    dr_top = (r60 - r0) / 60.0
    dg_top = (g60 - g0) / 60.0
    db_top = (b60 - b0) / 60.0
    
    for y_pad in range(top_pad):
        dist = top_pad - y_pad
        factor = dist / float(top_pad)
        r_base = max(0, min(255, int(r0 - dr_top * dist * (1.0 - 0.5 * factor))))
        g_base = max(0, min(255, int(g0 - dg_top * dist * (1.0 - 0.5 * factor))))
        b_base = max(0, min(255, int(b0 - db_top * dist * (1.0 - 0.5 * factor))))
        
        row_bytes = bytearray(w * 3)
        for x in range(w):
            orig_r = raw_scaled[(0 * w + x)*3]
            orig_g = raw_scaled[(0 * w + x)*3 + 1]
            orig_b = raw_scaled[(0 * w + x)*3 + 2]
            dev_r = (orig_r - r0) * (1.0 - factor)
            dev_g = (orig_g - g0) * (1.0 - factor)
            dev_b = (orig_b - b0) * (1.0 - factor)
            row_bytes[x*3] = max(0, min(255, int(r_base + dev_r)))
            row_bytes[x*3 + 1] = max(0, min(255, int(g_base + dev_g)))
            row_bytes[x*3 + 2] = max(0, min(255, int(b_base + dev_b)))
            
        raw_out[y_pad * w * 3 : (y_pad + 1) * w * 3] = row_bytes

    # 2. Main image content
    raw_out[top_pad * w * 3 : (top_pad + scaled_h) * w * 3] = raw_scaled

    # 3. Bottom gradient extrapolation
    r_last = sum(raw_scaled[((h - 1) * w + x)*3] for x in range(w)) / float(w)
    g_last = sum(raw_scaled[((h - 1) * w + x)*3 + 1] for x in range(w)) / float(w)
    b_last = sum(raw_scaled[((h - 1) * w + x)*3 + 2] for x in range(w)) / float(w)
    
    r_prev = sum(raw_scaled[((h - 60) * w + x)*3] for x in range(w)) / float(w)
    g_prev = sum(raw_scaled[((h - 60) * w + x)*3 + 1] for x in range(w)) / float(w)
    b_prev = sum(raw_scaled[((h - 60) * w + x)*3 + 2] for x in range(w)) / float(w)
    
    dr_bot = (r_last - r_prev) / 60.0
    dg_bot = (g_last - g_prev) / 60.0
    db_bot = (b_last - b_prev) / 60.0
    
    for y_pad in range(bot_pad):
        dist = y_pad + 1
        y_dest = top_pad + h + y_pad
        factor = dist / float(bot_pad)
        
        r_base = max(0, min(255, int(r_last + dr_bot * dist * (1.0 - 0.5 * factor))))
        g_base = max(0, min(255, int(g_last + dg_bot * dist * (1.0 - 0.5 * factor))))
        b_base = max(0, min(255, int(b_last + db_bot * dist * (1.0 - 0.5 * factor))))
        
        row_bytes = bytearray(w * 3)
        for x in range(w):
            orig_r = raw_scaled[((h - 1) * w + x)*3]
            orig_g = raw_scaled[((h - 1) * w + x)*3 + 1]
            orig_b = raw_scaled[((h - 1) * w + x)*3 + 2]
            dev_r = (orig_r - r_last) * (1.0 - factor)
            dev_g = (orig_g - g_last) * (1.0 - factor)
            dev_b = (orig_b - b_last) * (1.0 - factor)
            row_bytes[x*3] = max(0, min(255, int(r_base + dev_r)))
            row_bytes[x*3 + 1] = max(0, min(255, int(g_base + dev_g)))
            row_bytes[x*3 + 2] = max(0, min(255, int(b_base + dev_b)))
            
        raw_out[y_dest * w * 3 : (y_dest + 1) * w * 3] = row_bytes

    with open(tmp_out, 'wb') as f:
        f.write(f"P6\n{w} {out_h}\n255\n".encode('ascii'))
        f.write(raw_out)
        
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    subprocess.check_call(['magick', tmp_out, out_path])
    print(f"Generated: {out_path} ({w}x{out_h})")

def main():
    banners = [
        '01_offline_security.png',
        '02_qr_scanner.png',
        '03_pet_academy.png',
        '04_encrypted_backup.png'
    ]
    for lang in ['vi', 'en']:
        for b in banners:
            src = f"assets/banners/{lang}/{b}"
            dst = f"assets/banners/ios/{lang}/{b}"
            process_banner(src, dst)

if __name__ == '__main__':
    main()
