import math
kB   = 1.380649e-23
h    = 6.62607015e-34
hbar = 1.054571817e-34
c    = 299792458.0
eps0 = 8.8541878128e-12

def omega_from_gsat(gamma_2pi_MHz, I_mWcm2, Isat_mWcm2):
    gamma = 2*math.pi*gamma_2pi_MHz*1e6
    I     = I_mWcm2   * 10.0    # mW/cm^2 → W/m^2
    Isat  = Isat_mWcm2* 10.0
    return gamma * math.sqrt(I/(2*Isat))
