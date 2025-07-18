import React, { useEffect, useState } from 'react'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { profileService, SecurityLog } from '../lib/api'
import { Activity, Calendar, Info, User } from 'lucide-react';
import LoaderComponent from '../components/ui/LoaderComponent';

const type = {
    LOGIN: 'Login',
    LOGOUT: 'Logout',
    PASSWORD_CHANGE: 'Password Change',
    EMAIL_CHANGE: 'Email Change',
    PROFILE_UPDATE: 'Profile Update',
    TWO_FACTOR_ENABLED: 'Two Factor Enabled',
    TWO_FACTOR_DISABLED: 'Two Factor Disabled',
    TWO_FACTOR_LOGIN: 'Two Factor Login',
    DOCUMENT_UPLOAD: 'Document Upload',
    DOCUMENT_DELETE: 'Document Delete',
    DOCUMENT_DOWNLOAD: 'Document Download',
    CHAT_SAVE: 'Chat Save',
    CHAT_DELETE: 'Chat Delete',
}

function SecuritySettings() {
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            const logs = await profileService.getSecurityLogs();
            setLogs(logs.logs);
            setIsLoading(false);
        }
        fetchLogs();
    }, []);

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    if (isLoading) {
        return <LoaderComponent />
    }

    const truncateString = (str: string, maxLength: number) => {
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength) + '...';
    }

  return (
    <div>
        <span className='flex flex-col gap-1 p-6 px-8'>
            <h1 className='text-3xl font-bold font-serif'>Security Settings</h1>
            <p className='text-sm text-gray-500'>Authentication and security changes in your account are logged here. Logs are retained for 60 days.</p>
        </span>
        
        <div className='rounded-md border flex flex-col gap-2 border-gray-200 mx-8'>
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className='w-1/4 p-4'>
                        <span className='flex items-center gap-2'>
                            <User className='w-4 h-4' />
                            User
                        </span>
                    </TableHead>
                    <TableHead className='w-1/4 p-4'>
                        <span className='flex items-center gap-2'>
                            <Activity className='w-4 h-4' />
                            Action
                        </span>
                    </TableHead>
                    <TableHead className='w-1/4 p-4'>
                        <span className='flex items-center gap-2'>
                            <Info className='w-4 h-4' />
                            IP Address
                        </span>
                    </TableHead>
                    <TableHead className='w-1/4 p-4'>
                        <span className='flex items-center gap-2'>
                            <Calendar className='w-4 h-4' />
                            Date
                        </span>
                    </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="font-medium w-1/4 p-4">{log.user.name || log.user.email}</TableCell>
                            <TableCell className='w-1/4 text-start p-4'>
                                <span className={`text-xs text-gray-700`}>
                                    {/* {type[log.action as keyof typeof type]} */}
                                    {log.details && <span className='text-xs text-gray-500'>{truncateString(log.details, 50)}</span>}
                                </span>
                            </TableCell>
                            <TableCell className='w-1/4 font-mono p-4'>{log.ip_address}</TableCell>
                            <TableCell className="w-1/4 p-4">{formatDateTime(log.created_at)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
 
    </div>
  )
}

export default SecuritySettings