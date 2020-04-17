import React from 'react';
import {
	Text,
	TextStyle,
	StyleSheet,
	StyleProp,
	View,
	TouchableOpacity,
	TouchableOpacityProps,
	GestureResponderHandlers,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import _ from 'lodash';

interface Props {
	children?: string;
	textStyle?: StyleProp<TextStyle>;
	iconStyle?: StyleProp<TextStyle>;
	/** The outermost component will receive this flex value. The style prop is not passed to the
	 * outermost component, so if you want to use flex you'll need to use this prop. However,
	 * besides flex, the outermost component is sized according to its children, so height,
	 * width and borders should work as expected
	 */
	touchableFlex?: number;
	/** Icon name */
	name: string;
	/** Specify this property if you want the icon to track gestures (and not the whole container) */
	iconHandlers?: GestureResponderHandlers;
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		textAlign: 'center',
	},
	iconWrapperStyle: {
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'stretch',
	},
	flex0: {
		flex: 0,
	},
	flex1: {
		flex: 1,
	},
});
const MemoizedIcon = React.memo(Icon, _.isEqual.bind(_));

const IconButton = ({
	children,
	style,
	textStyle,
	iconStyle,
	touchableFlex,
	name,
	iconHandlers,
	...props
}: Props & TouchableOpacityProps): JSX.Element => {
	const containerStyle = touchableFlex === 1 ? styles.flex1 : styles.flex0;
	return (
		<TouchableOpacity style={containerStyle} {...props}>
			<View style={[styles.container, style]}>
				<View style={styles.iconWrapperStyle} {...iconHandlers}>
					<MemoizedIcon style={iconStyle} name={name} />
				</View>
				<Text style={textStyle}>{children}</Text>
			</View>
		</TouchableOpacity>
	);
};

export default IconButton;
