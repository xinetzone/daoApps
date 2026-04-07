#!/usr/bin/env python3
"""
图片压缩脚本

该脚本用于压缩项目中的图片文件，包括PNG和JPG格式。
压缩后的图片将替换原文件，同时记录压缩前后的大小对比。
"""

import os
import sys
from PIL import Image
import json

# 定义要压缩的目录
target_dirs = [
    'assets/images',
    'apps/forum/public/images',
    'apps/growth-tracker/public/images',
    'apps/habit-tracker/public/images',
    'apps/moodflow/public/images',
    'apps/time-capsule/public/images',
    'apps/xinyu/public/images',
    'doc/_static/images',
    'doc/cultivate/dao/alltheory/psi-awakening-theory/popular-guide/images',
    'doc/cultivate/de/me/images'
]

# 压缩配置
PNG_QUALITY = 85
JPG_QUALITY = 80
MAX_WIDTH = 1920
MAX_HEIGHT = 1080

def compress_image(input_path):
    """压缩单个图片文件"""
    try:
        # 打开图片
        img = Image.open(input_path)
        
        # 记录原始大小
        original_size = os.path.getsize(input_path)
        
        # 调整大小（如果图片太大）
        width, height = img.size
        if width > MAX_WIDTH or height > MAX_HEIGHT:
            # 保持宽高比
            aspect_ratio = width / height
            if width > MAX_WIDTH:
                new_width = MAX_WIDTH
                new_height = int(new_width / aspect_ratio)
            else:
                new_height = MAX_HEIGHT
                new_width = int(new_height * aspect_ratio)
            img = img.resize((new_width, new_height), Image.LANCZOS)
        
        # 压缩并保存
        if input_path.lower().endswith('.png'):
            img.save(input_path, 'PNG', optimize=True, quality=PNG_QUALITY)
        elif input_path.lower().endswith(('.jpg', '.jpeg')):
            img.save(input_path, 'JPEG', optimize=True, quality=JPG_QUALITY)
        else:
            return None
        
        # 记录压缩后大小
        compressed_size = os.path.getsize(input_path)
        
        # 计算压缩率
        reduction = ((original_size - compressed_size) / original_size) * 100
        
        return {
            'path': input_path,
            'original_size': original_size,
            'compressed_size': compressed_size,
            'reduction': reduction,
            'width': width,
            'height': height
        }
        
    except Exception as e:
        print(f"压缩失败 {input_path}: {e}")
        return None

def main():
    """主函数"""
    results = []
    total_original = 0
    total_compressed = 0
    
    print("开始压缩图片...")
    
    for target_dir in target_dirs:
        print(f"\n处理目录: {target_dir}")
        
        if not os.path.exists(target_dir):
            print(f"目录不存在: {target_dir}")
            continue
        
        for root, dirs, files in os.walk(target_dir):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                    file_path = os.path.join(root, file)
                    result = compress_image(file_path)
                    if result:
                        results.append(result)
                        total_original += result['original_size']
                        total_compressed += result['compressed_size']
                        print(f"压缩 {file}: {result['reduction']:.1f}% 减少")
    
    # 生成报告
    total_reduction = ((total_original - total_compressed) / total_original) * 100 if total_original > 0 else 0
    
    report = {
        'total_original': total_original,
        'total_compressed': total_compressed,
        'total_reduction': total_reduction,
        'files_processed': len(results),
        'details': results
    }
    
    # 保存报告
    report_path = 'image_compression_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # 打印摘要
    print("\n" + "="*50)
    print("压缩摘要")
    print("="*50)
    print(f"处理文件数: {len(results)}")
    print(f"原始总大小: {total_original / 1024 / 1024:.2f} MB")
    print(f"压缩总大小: {total_compressed / 1024 / 1024:.2f} MB")
    print(f"总减少量: {total_reduction:.1f}%")
    print(f"报告已保存至: {report_path}")
    print("="*50)

if __name__ == "__main__":
    main()
