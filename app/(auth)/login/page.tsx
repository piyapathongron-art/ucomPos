import { LoginForm } from '@/components/features/auth/LoginForm';
import { APP_VERSION, LAST_UPDATE } from '@/lib/constants';

export const metadata = {
  title: 'เข้าสู่ระบบ | UcomPos',
};

export default function LoginPage() {
  return (
    <>
      <LoginForm />
      <div className="fixed bottom-4 right-4 text-right z-10">
        <p className="text-xs text-slate-500 dark:text-slate-500 font-semibold">
          Version {APP_VERSION}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-600">
          อัปเดตล่าสุด: {LAST_UPDATE}
        </p>
      </div>
    </>
  );
}
