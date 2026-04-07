#!/usr/bin/env python3
"""
文件大小检查脚本

用于pre-commit钩子，检查提交的文件大小是否符合要求。
"""

import os
import sys
import argparse

# 文件类型和大小限制配置
FILE_SIZE_LIMITS = {
    # 图片文件
    '.png': 5 * 1024 * 1024,    # 5MB
    '.jpg': 5 * 1024 * 1024,    # 5MB
    '.jpeg': 5 * 1024 * 1024,   # 5MB
    '.gif': 5 * 1024 * 1024,     # 5MB
    '.webp': 5 * 1024 * 1024,    # 5MB
    
    # 文档文件
    '.pdf': 10 * 1024 * 1024,    # 10MB
    
    # 压缩文件
    '.zip': 20 * 1024 * 1024,    # 20MB
    '.tar': 20 * 1024 * 1024,    # 20MB
    '.tar.gz': 20 * 1024 * 1024, # 20MB
    
    # 其他文件
    'default': 10 * 1024 * 1024, # 默认10MB
}

def get_file_size_limit(file_path):
    """根据文件扩展名获取大小限制"""
    ext = os.path.splitext(file_path)[1].lower()
    return FILE_SIZE_LIMITS.get(ext, FILE_SIZE_LIMITS['default'])

def check_file_size(file_path):
    """检查单个文件的大小"""
    try:
        file_size = os.path.getsize(file_path)
        limit = get_file_size_limit(file_path)
        
        if file_size > limit:
            ext = os.path.splitext(file_path)[1].lower()
            limit_mb = limit / 1024 / 1024
            file_size_mb = file_size / 1024 / 1024
            
            return False, f"文件 {file_path} 大小 ({file_size_mb:.2f}MB) 超过限制 ({limit_mb:.2f}MB)"
        
        return True, None
        
    except Exception as e:
        return False, f"检查文件 {file_path} 时出错: {e}"

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='检查文件大小')
    parser.add_argument('files', nargs='*', help='要检查的文件')
    args = parser.parse_args()
    
    if not args.files:
        print('没有文件需要检查')
        return 0
    
    errors = []
    
    for file_path in args.files:
        if os.path.isfile(file_path):
            success, message = check_file_size(file_path)
            if not success:
                errors.append(message)
    
    if errors:
        print('文件大小检查失败:')
        for error in errors:
            print(f'- {error}')
        return 1
    
    print('所有文件大小检查通过')
    return 0

if __name__ == '__main__':
    sys.exit(main())
