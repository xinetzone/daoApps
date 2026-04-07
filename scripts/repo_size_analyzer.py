#!/usr/bin/env python3
"""
仓库大小分析脚本

定期分析Git仓库的大小，识别大型文件，生成分析报告。
"""

import os
import sys
import json
import subprocess
import datetime
from pathlib import Path

def run_command(cmd, cwd=None):
    """运行命令并返回输出"""
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            cwd=cwd, 
            capture_output=True, 
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        return result.stdout, result.stderr, result.returncode
    except Exception as e:
        return '', str(e), 1

def get_repo_size():
    """获取仓库大小信息"""
    output, error, _ = run_command('git count-objects -vH')
    if error:
        return None, error
    
    size_info = {}
    for line in output.strip().split('\n'):
        if ': ' in line:
            key, value = line.split(': ', 1)
            size_info[key.strip()] = value.strip()
    
    return size_info, None

def get_large_objects(top_n=20):
    """获取仓库中体积最大的对象"""
    # 使用PowerShell命令获取大型对象
    cmd = f'''
    git rev-list --objects --all | 
    git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | 
    Sort-Object -Property @{{Expression={{[int]($_ -split ' ')[2]}}}} | 
    Select-Object -Last {top_n}
    '''
    
    output, error, _ = run_command(cmd)
    if error:
        return None, error
    
    large_objects = []
    for line in output.strip().split('\n'):
        if line:
            parts = line.split(' ', 3)
            if len(parts) >= 4:
                obj_type, obj_hash, obj_size, rest = parts
                large_objects.append({
                    'type': obj_type,
                    'hash': obj_hash,
                    'size': int(obj_size),
                    'path': rest
                })
    
    return large_objects, None

def get_large_files(min_size=10*1024*1024):
    """获取超过指定大小的文件"""
    # 先获取所有对象，然后过滤出大于指定大小的文件
    cmd = '''
    git rev-list --objects --all | 
    git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)'
    '''
    
    output, error, _ = run_command(cmd)
    if error:
        return None, error
    
    large_files = []
    for line in output.strip().split('\n'):
        if line:
            parts = line.split(' ', 3)
            if len(parts) >= 4:
                obj_type, obj_hash, obj_size, rest = parts
                size = int(obj_size)
                if size >= min_size and obj_type == 'blob':
                    large_files.append({
                        'type': obj_type,
                        'hash': obj_hash,
                        'size': size,
                        'path': rest
                    })
    
    # 按大小排序
    large_files.sort(key=lambda x: x['size'], reverse=True)
    return large_files, None

def get_file_history(file_path):
    """获取文件的历史变更记录"""
    cmd = f'git log --oneline --follow -- {file_path}'
    output, error, _ = run_command(cmd)
    if error:
        return None, error
    
    history = []
    for line in output.strip().split('\n'):
        if line:
            parts = line.split(' ', 1)
            if len(parts) >= 2:
                commit_hash, message = parts
                history.append({
                    'commit': commit_hash,
                    'message': message
                })
    
    return history, None

def generate_report():
    """生成仓库大小分析报告"""
    report = {
        'timestamp': datetime.datetime.now().isoformat(),
        'repo_info': {},
        'large_objects': [],
        'large_files': [],
        'analysis': {},
        'recommendations': []
    }
    
    # 获取仓库大小信息
    size_info, error = get_repo_size()
    if size_info:
        report['repo_info'] = size_info
    else:
        report['repo_info']['error'] = error
    
    # 获取大型对象
    large_objects, error = get_large_objects(20)
    if large_objects:
        report['large_objects'] = large_objects
    else:
        report['large_objects'] = []
        report['analysis']['large_objects_error'] = error
    
    # 获取超过10MB的文件
    large_files, error = get_large_files(10*1024*1024)
    if large_files:
        report['large_files'] = large_files
        # 为每个大文件获取历史记录
        for file_info in large_files:
            history, hist_error = get_file_history(file_info['path'])
            if history:
                file_info['history'] = history
            else:
                file_info['history_error'] = hist_error
    else:
        report['large_files'] = []
        report['analysis']['large_files_error'] = error
    
    # 分析
    report['analysis']['total_large_files'] = len(report['large_files'])
    report['analysis']['total_large_objects'] = len(report['large_objects'])
    
    if report['large_files']:
        total_large_file_size = sum(f['size'] for f in report['large_files'])
        report['analysis']['total_large_file_size'] = total_large_file_size
        report['analysis']['total_large_file_size_mb'] = total_large_file_size / 1024 / 1024
    
    # 生成建议
    if report['large_files']:
        report['recommendations'].append('考虑使用Git LFS跟踪大型文件')
        report['recommendations'].append('清理历史提交中的大型文件')
    
    if 'size' in report['repo_info']:
        size_str = report['repo_info']['size']
        if 'MiB' in size_str:
            size_mb = float(size_str.split()[0])
            if size_mb > 100:
                report['recommendations'].append('仓库大小超过100MB，建议进行清理')
    
    # 检查.gitignore配置
    gitignore_path = Path('.gitignore')
    if gitignore_path.exists():
        with open(gitignore_path, 'r', encoding='utf-8', errors='replace') as f:
            gitignore_content = f.read()
        report['analysis']['gitignore_exists'] = True
        report['analysis']['gitignore_lines'] = len(gitignore_content.split('\n'))
    else:
        report['analysis']['gitignore_exists'] = False
        report['recommendations'].append('创建.gitignore文件以忽略不必要的文件')
    
    return report

def main():
    """主函数"""
    print('开始分析仓库大小...')
    
    report = generate_report()
    
    # 保存报告
    report_path = f'repo_size_report_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # 打印摘要
    print('\n' + '='*60)
    print('仓库大小分析报告摘要')
    print('='*60)
    
    if 'size' in report['repo_info']:
        print(f"仓库大小: {report['repo_info']['size']}")
    if 'count' in report['repo_info']:
        print(f"对象数量: {report['repo_info']['count']}")
    
    print(f"大型文件数量: {report['analysis'].get('total_large_files', 0)}")
    if 'total_large_file_size_mb' in report['analysis']:
        print(f"大型文件总大小: {report['analysis']['total_large_file_size_mb']:.2f} MB")
    
    print('\n建议:')
    for rec in report['recommendations']:
        print(f'- {rec}')
    
    print(f'\n详细报告已保存至: {report_path}')
    print('='*60)

if __name__ == '__main__':
    main()
