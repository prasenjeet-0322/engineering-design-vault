#include <iostream>
#include <mutex>

using namespace std;

/**
 * Modern C++11+ (Meyers' Singleton)
 * Guaranteed thread-safe by ISO C++11 standard (§6.7 [stmt.dcl]) via "Magic Statics".
 */
class ModernPaymentGatewayManager
{
private:
    ModernPaymentGatewayManager()
    {
        cout << "Modern Payment Gateway Manager initialized." << endl;
    }
    ~ModernPaymentGatewayManager() = default;

public:
    // Prevent copying and moving
    ModernPaymentGatewayManager(const ModernPaymentGatewayManager&) = delete;
    ModernPaymentGatewayManager& operator=(const ModernPaymentGatewayManager&) = delete;
    ModernPaymentGatewayManager(ModernPaymentGatewayManager&&) = delete;
    ModernPaymentGatewayManager& operator=(ModernPaymentGatewayManager&&) = delete;

    static ModernPaymentGatewayManager& getInstance()
    {
        static ModernPaymentGatewayManager instance; // Thread-safe lazy init
        return instance;
    }

    void processPayment(double amount)
    {
        cout << "[Modern] Processing payment of $" << amount << " through payment gateway." << endl;
    }
};

/**
 * Traditional C++ (Double-Checked Locking with Mutex)
 */
class LegacyPaymentGatewayManager
{
private:
    LegacyPaymentGatewayManager()
    {
        cout << "Legacy Payment Gateway Manager initialized." << endl;
    }

    static LegacyPaymentGatewayManager *instance;
    static mutex mtx;

public:
    static LegacyPaymentGatewayManager *getInstance()
    {
        if (instance == nullptr)
        {
            lock_guard<mutex> lock(mtx);
            if (instance == nullptr)
            {
                instance = new LegacyPaymentGatewayManager();
            }
        }
        return instance;
    }

    void processPayment(double amount)
    {
        cout << "[Legacy] Processing payment of $" << amount << " through payment gateway." << endl;
    }
};

LegacyPaymentGatewayManager *LegacyPaymentGatewayManager::instance = nullptr;
mutex LegacyPaymentGatewayManager::mtx;

int main()
{
    // Test Modern Meyers' Singleton
    ModernPaymentGatewayManager &pg1 = ModernPaymentGatewayManager::getInstance();
    pg1.processPayment(100.0);
    ModernPaymentGatewayManager &pg2 = ModernPaymentGatewayManager::getInstance();

    if (&pg1 == &pg2)
    {
        cout << "✅ Modern Meyers' Singleton verified: Both references point to same address (&pg1 == &pg2)." << endl;
    }

    // Test Legacy DCL Singleton
    LegacyPaymentGatewayManager *legacy1 = LegacyPaymentGatewayManager::getInstance();
    LegacyPaymentGatewayManager *legacy2 = LegacyPaymentGatewayManager::getInstance();

    if (legacy1 == legacy2)
    {
        cout << "✅ Legacy DCL Singleton verified." << endl;
    }

    return 0;
}