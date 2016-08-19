'use strict';

import React from 'react';
import BaseComponent from './base-component';

var platformsStore = require('../stores/platforms-store');
var devicesStore = require('../stores/devices-store');
var devicesActionCreators = require('../action-creators/devices-action-creators');
var statusIndicatorActionCreators = require('../action-creators/status-indicator-action-creators');
import DevicesFound from './devices-found';

class ConfigureDevices extends BaseComponent {
    constructor(props) {
        super(props);
        this._bind('_onPlatformStoresChange', '_onDevicesStoresChange', '_onDeviceMethodChange',
                    '_onProxySelect', '_onDeviceStart', '_onDeviceEnd', '_onAddress', '_onWhoIs',
                    '_onDeviceStart', '_onDeviceEnd', '_onAddress', '_showCancel', '_resumeScan', 
                    '_cancelScan');

        this.state = getInitialState();
    }
    componentDidMount() {
        platformsStore.addChangeListener(this._onPlatformStoresChange);
        devicesStore.addChangeListener(this._onDevicesStoresChange);
    }
    componentWillUnmount() {
        platformsStore.removeChangeListener(this._onPlatformStoresChange);
        devicesStore.removeChangeListener(this._onDevicesStoresChange);
    }
    _onPlatformStoresChange() {

        if (this.state.platform)
        {            
            var bacnetProxies = platformsStore.getRunningBacnetProxies(this.state.platform.uuid);
            
            this.setState({ bacnetProxies: bacnetProxies });

            if ((bacnetProxies.length < 1) && this.state.deviceMethod === "scanForDevices")
            {
                this.setState({ deviceMethod: "addDevicesManually" });
            }
        }
    }
    _onDevicesStoresChange() {

        var deviceState = devicesStore.getState();

        if (deviceState.action === "get_scan_settings")
        {
            this.setState(getInitialState());
        }
        else
        {        
            if (deviceState.platform && this.state.platform)
            {
                if (deviceState.platform.uuid !== this.state.platform.uuid)
                {
                    deviceState.bacnetProxies = platformsStore.getRunningBacnetProxies(deviceState.platform.uuid);
                    deviceState.deviceMethod = (deviceState.bacnetProxies.length ? "scanForDevices" : "addDevicesManually");
                    
                    if (deviceState.deviceMethod === "scanForDevices")
                    {
                        deviceState.selectedProxyUuid = deviceState.bacnetProxies[0].uuid;
                    }

                    deviceState.scanning = false;

                    this.setState(deviceState);
                }
                else
                {
                    this.setState({scanning: true});
                }
            }
        }

    }
    _onDeviceMethodChange(evt) {

        var deviceMethod = evt.target.value;

        if (this.state.bacnetProxies.length)
        {
            this.setState({ deviceMethod: deviceMethod });
        }
        else
        {
            statusIndicatorActionCreators.openStatusIndicator("error", 
                "Can't scan for devices: A BACNet proxy agent for the platform must be installed and running.", null, "left");
        }
    }
    _onProxySelect(evt) {
        var selectedProxyUuid = evt.target.value;
        this.setState({ selectedProxyUuid: selectedProxyUuid });
    }
    _onDeviceStart(evt) {
        this.setState({ deviceStart: evt.target.value });
    }
    _onDeviceEnd(evt) {
        this.setState({ deviceEnd: evt.target.value });
    }
    _onAddress(evt) {
        this.setState({ address: evt.target.value });
    }
    _onWhoIs(evt) {
        devicesActionCreators.scanForDevices(
            this.state.platform.uuid, 
            this.state.selectedProxyUuid,
            this.state.deviceStart, 
            this.state.deviceEnd, 
            this.state.address
        );

        this.setState({ scanning: true });
    }
    _showCancel() {

        if (this.state.scanning)
        {
            this.setState({cancelButton: true});
        }
    }
    _resumeScan() {

        if (this.state.scanning)
        {
            this.setState({cancelButton: false});
        }
    }
    _cancelScan() {
        this.setState({scanning: false});
    }
    render() {

        var deviceContent, defaultMessage;

        if (this.state.platform)
        {

            var platform = this.state.platform;

            var methodSelect = (
                <select
                    onChange={this._onDeviceMethodChange}
                    value={this.state.deviceMethod}
                    autoFocus
                    required
                >
                    <option value="scanForDevices">Scan for Devices</option>
                    <option value="addDevicesManually">Add Manually</option>
                </select>
            );

            var proxySelect;

            var wideStyle = {
                width: "100%"
            }

            var fifthCell = {
                width: "20px"
            }        

            if (this.state.deviceMethod === "scanForDevices")
            {
                var proxies = this.state.bacnetProxies.map(function (proxy) {
                    return (
                        <option key={proxy.uuid} value={proxy.uuid}>{proxy.name}</option>
                    );
                });

                proxySelect = (
                    <tr>
                        <td className="plain"><b>BACNet Proxy Agent: </b></td>

                        <td className="plain"
                            colSpan={4}>
                            <select
                                style={wideStyle}
                                onChange={this._onProxySelect}
                                value={this.state.selectedProxyUuid}
                                autoFocus
                                required
                            >
                                {proxies}
                            </select>
                        </td>

                        <td className="plain" style={fifthCell}></td>
                    </tr>
                );
            }

            var buttonStyle = {
                height: "21px"
            }

            var platformNameLength = platform.name.length * 6;

            var platformNameStyle = {
                width: "25%",
                minWidth: platformNameLength
            }

            var deviceRangeStyle = {
                width: "70px"
            }

            var tdStyle = {
                minWidth: "120px"
            }

            var scanOptions = (
                <div className="detectDevicesContainer">
                    <div className="detectDevicesBox">
                        <table>
                            <tbody>
                                {proxySelect}
                                <tr>
                                    <td className="plain" style={tdStyle}><b>Device ID Range</b></td>
                                    <td className="plain">Start:</td>
                                    <td className="plain">
                                        <input
                                            type="number"
                                            style={deviceRangeStyle}
                                            onChange={this._onDeviceStart}
                                            value={this.state.deviceStart}></input>
                                    </td>
                                    <td className="plain">End:</td>
                                    <td className="plain">
                                        <input 
                                            type="number"
                                            style={deviceRangeStyle}
                                            onChange={this._onDeviceEnd}
                                            value={this.state.deviceEnd}></input>
                                    </td>
                                    <td className="plain"></td>
                                </tr>
                                <tr>
                                    <td><b>Address</b></td>
                                    <td className="plain"
                                        colSpan={4}>
                                        <input 
                                            style={wideStyle}
                                            type="text"
                                            onChange={this._onAddress}
                                            value={this.state.address}></input>
                                    </td>
                                    <td className="plain" style={fifthCell}></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>                
                </div>
            )

            var scanOptionsStyle = {
                float: "left",
                marginRight: "10px"
            }

            var platformNameStyle = {
                float: "left",
                width: "100%"
            }

            var devicesContainer;
            var scanButton;

            if (this.state.scanning)
            {
                var spinnerContent;
                var spinnerMessage = "Scanning for devices ...";

                if (this.state.cancelButton)
                {
                    spinnerContent = <span className="cancelScanning"><i className="fa fa-remove"></i></span>;
                }
                else
                {
                    spinnerContent = <i className="fa fa-cog fa-spin fa-2x fa-fw margin-bottom"></i>;
                }

                devicesContainer = <DevicesFound platform={this.state.platform}/>;
                scanButton = (
                    <div style={scanOptionsStyle}>
                        <div className="scanningSpinner"
                            onClick={this._cancelScan}
                            onMouseEnter={this._showCancel}
                            onMouseLeave={this._resumeScan}>
                            {spinnerContent}
                            {spinnerMessage}
                        </div>
                    </div>
                );
            }
            else
            {
                scanButton = <div style={scanOptionsStyle}><button style={buttonStyle} onClick={this._onWhoIs}>Go</button></div>;
            }


            deviceContent = (
                <div className="device-box device-scan">
                    <div style={platformNameStyle}>
                        <div style={scanOptionsStyle}>
                            <b>Instance: </b>
                        </div>
                        <div style={scanOptionsStyle}>{platform.name}</div>
                    </div>
                    <div style={scanOptionsStyle}><b>Method: </b></div>
                    <div style={scanOptionsStyle}>{methodSelect}</div>  
                    <div style={scanOptionsStyle}>{scanOptions}</div>
                    {scanButton}
                </div>
            )
            
        }
        else
        {
            defaultMessage = (
                <div>Launch device installation from the side tree by clicking on the <i className="fa fa-cogs"></i> button next to the platform instance.</div>
            )
        }

        
        return (  
            <div className="view">   
                <h2>Install Devices</h2>      
                {deviceContent} 
                {defaultMessage} 
                <div className="device-box device-container">
                    {devicesContainer}
                </div> 

            </div>         
        );
    }
};


function getInitialState() {

    var state = devicesStore.getState();

    if (state.platform)
    {
        state.bacnetProxies = platformsStore.getRunningBacnetProxies(state.platform.uuid);
        state.deviceMethod = (state.bacnetProxies.length ? "scanForDevices" : "addDevicesManually");

        state.deviceStart = "";
        state.deviceEnd = "";
        state.address = "";

        state.newScan = true;
        
        if (state.deviceMethod === "scanForDevices")
        {
            state.selectedProxyUuid = state.bacnetProxies[0].uuid;
        }

        state.scanning = false;
        state.cancelButton = false;
    }

    return state;
}

export default ConfigureDevices;